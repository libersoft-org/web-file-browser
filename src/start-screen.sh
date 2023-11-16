#!/bin/sh

#[ ! -d "./node_modules/" ] && bun i
screen -dmS file bash -c '
while true; do
 bun file.js || exit 1
done
'
