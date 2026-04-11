#!/usr/bin/env expect

set timeout 120

spawn zeus bridge

expect -re "bridge\\$"
send "connect\r"

expect -re "successfully connected"
send "install -t \"Amazfit Active 2 NFC (Round)\"\r"

sleep 30
send "exit\r"

expect eof
