#!/bin/sh
# 32 hex chars — matches Zeppelin KEY length.
openssl rand -hex 16
echo
echo "Paste that value into Railway as KEY on api, bot, and dashboard."
