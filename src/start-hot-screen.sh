#!/bin/sh

#[ ! -d "./node_modules/" ] && bun i
screen -dmS file bun --hot file.js
