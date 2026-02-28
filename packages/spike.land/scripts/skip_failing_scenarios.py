import argparse
import json
import glob
import os
import re

def cleanup_skip_tags():
    """Remove duplicate @skip lines and convert inline @skip comments to proper format."""
    feature_files = glob.glob('e2e/features/**/*.feature', recursive=True)
    feature_files += glob.glob('e2e/features/*.feature')
    feature_files = list(set(feature_files))

    for filepath in sorted(feature_files):
        if not os.path.exists(filepath):
            continue

        with open(filepath, 'r') as f:
            lines = f.readlines()

        new_lines = []
        modified = False
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()

            # Check for malformed @skip with inline comment
            match = re.match(r'^(\s*)@skip\s+#\s*(.*)', line)
            if match:
                indentation = match.group(1)
                reason = match.group(2).strip()
                # Remove "Error: " prefix if present
                if reason.startswith('Error: '):
                    reason = reason[len('Error: '):]

                # Skip any consecutive duplicate @skip lines
                while i + 1 < len(lines) and re.match(r'^\s*@skip\s+#', lines[i + 1]):
                    i += 1
                    modified = True

                # Emit proper format
                new_lines.append(f"{indentation}# SKIP REASON: {reason}\n")
                new_lines.append(f"{indentation}@skip\n")
                modified = True
                i += 1
                continue

            # Check for duplicate consecutive @skip lines (bare)
            if stripped == '@skip' and new_lines:
                prev_stripped = new_lines[-1].strip()
                if prev_stripped == '@skip':
                    # Skip this duplicate
                    modified = True
                    i += 1
                    continue

            new_lines.append(line)
            i += 1

        if modified:
            print(f"  Cleaned up {filepath}")
            with open(filepath, 'w') as f:
                f.writelines(new_lines)

def analyze_failures():
    report_files = glob.glob('ci-output/e2e-reports-shard-*/cucumber-report-ci.json')
    failures = []

    for report_file in report_files:
        try:
            with open(report_file, 'r') as f:
                features = json.load(f)
                
            for feature in features:
                feature_uri = feature.get('uri')
                if not feature_uri:
                    continue
                    
                for element in feature.get('elements', []):
                    if element.get('type') != 'scenario':
                        continue
                        
                    is_failed = False
                    error_message = ""
                    
                    for step in element.get('steps', []):
                        result = step.get('result', {})
                        if result.get('status') == 'failed':
                            is_failed = True
                            error_message = result.get('error_message', 'Unknown error')
                            if error_message:
                                error_message = error_message.split('\n')[0].strip()
                            break
                    
                    if is_failed:
                        failures.append({
                            'uri': feature_uri,
                            'line': element.get('line'),
                            'name': element.get('name'),
                            'id': element.get('id'),
                            'error': error_message
                        })
                        
        except Exception as e:
            print(f"Error reading {report_file}: {e}")

    seen_ids = set()
    unique_failures = []
    for f in failures:
        if f['id'] not in seen_ids:
            seen_ids.add(f['id'])
            unique_failures.append(f)
    
    unique_failures.sort(key=lambda x: (x['uri'], x['line']))
    return unique_failures

def skip_failures():
    print("Analyzing failing tests from CI reports...")
    failures = analyze_failures()
    
    if not failures:
        print("No failing tests found.")
        return

    print(f"Found {len(failures)} failing scenarios.")
    files_to_modify = {}
    
    # Group failures by file
    for failure in failures:
        uri = failure['uri']
        if uri not in files_to_modify:
            files_to_modify[uri] = []
        files_to_modify[uri].append(failure)
    
    for uri, file_failures in files_to_modify.items():
        if not os.path.exists(uri):
            print(f"Warning: File {uri} not found. Skipping.")
            continue
            
        print(f"checking {uri}...")
        
        with open(uri, 'r') as f:
            lines = f.readlines()
            
        # Sort failures by line number in descending order to avoid offsetting lines
        file_failures.sort(key=lambda x: x['line'], reverse=True)
        
        modified = False
        for failure in file_failures:
            # Try to find the scenario line dynamically because line numbers might have shifted
            target_name = failure['name']
            expected_line = failure['line'] - 1
            line_idx = -1
            
            # Check if likely at expected line (or shifted)
            # Scan the whole file for the scenario name? 
            # It's safer to scan the whole file, but there might be duplicates? 
            # Scenarios usually have unique names in a file.
            
            entry_found = False
            for i, line in enumerate(lines):
                if line.strip().endswith(target_name): # "Scenario: <name>" or "Scenario Outline: <name>"
                    # Double check it is a scenario definition
                    if line.strip().startswith('Scenario') and target_name in line:
                        line_idx = i
                        entry_found = True
                        break
            
            if not entry_found:
                 print(f"  Could not locate scenario '{target_name}' in {uri}. It might have been skipped or moved.")
                 # Fallback to line number? No, risky.
                 continue

            # Normalized line_idx is where we want to potentially insert BEFORE
            
            indentation = ""
            match = re.search(r'^(\s*)', lines[line_idx])
            if match:
                indentation = match.group(1)
            
            reason = failure['error'].replace('"', "'")
            # Limit reason length
            if len(reason) > 100:
                reason = reason[:97] + "..."

            skip_comment = f"{indentation}# SKIP REASON: {reason}\n"
            skip_tag = f"{indentation}@skip\n"

            # Check if already skipped
            is_already_skipped = False

            # Search backwards for existing @skip or # SKIP REASON: tags
            for i in range(1, 5):
                if line_idx - i >= 0:
                    prev_line = lines[line_idx - i].strip()
                    if prev_line.startswith('@skip') or prev_line.startswith('@ignore') or prev_line.startswith('# SKIP REASON:'):
                        is_already_skipped = True
                        break
                    if prev_line.startswith('Scenario') or prev_line.startswith('Feature'):
                        break

            if not is_already_skipped:
                print(f"  Skipping '{target_name}' at line {line_idx + 1}")
                lines.insert(line_idx, skip_tag)
                lines.insert(line_idx, skip_comment)
                modified = True
            else:
                print(f"  '{target_name}' is already skipped.")
                
        if modified:
            with open(uri, 'w') as f:
                f.writelines(lines)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Skip failing E2E scenarios based on CI reports")
    parser.add_argument('--cleanup', action='store_true',
                        help="Remove duplicate @skip tags and fix inline comment format")
    args = parser.parse_args()

    if args.cleanup:
        cleanup_skip_tags()
    else:
        skip_failures()
