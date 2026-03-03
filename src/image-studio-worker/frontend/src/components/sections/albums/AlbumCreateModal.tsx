import { Button, Input, Modal, Select, TextArea } from "@/components/ui";
import { ALBUM_PRIVACY } from "@/constants/enums";

interface AlbumCreateModalProps {
  open: boolean;
  creating: boolean;
  newName: string;
  newDesc: string;
  newPrivacy: string;
  onClose: () => void;
  onNameChange: (name: string) => void;
  onDescChange: (desc: string) => void;
  onPrivacyChange: (privacy: string) => void;
  onCreate: () => void;
}

export function AlbumCreateModal({
  open,
  creating,
  newName,
  newDesc,
  newPrivacy,
  onClose,
  onNameChange,
  onDescChange,
  onPrivacyChange,
  onCreate,
}: AlbumCreateModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Create Album">
      <div className="space-y-4">
        <Input
          label="Name"
          value={newName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Album name"
        />
        <TextArea
          label="Description"
          value={newDesc}
          onChange={(e) => onDescChange(e.target.value)}
          placeholder="Optional description"
          rows={2}
        />
        <Select
          label="Privacy"
          value={newPrivacy}
          onChange={(e) => onPrivacyChange(e.target.value)}
          options={ALBUM_PRIVACY.map((p) => ({ value: p, label: p }))}
        />
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onCreate} loading={creating} disabled={!newName.trim()}>
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
}
