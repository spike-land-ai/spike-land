#!/usr/bin/env expect -f

spawn jules

# First, send Down arrow to select
sleep 4
send "\x1b\[B"
sleep 1

# Spam Ctrl+D every 3 seconds for 5 minutes (100 * 3s = 300s)
for {set i 0} {$i < 100} {incr i} {
    send "\x04"
    sleep 3
}

puts "\nTimeout reached (5 minutes). Exiting."
