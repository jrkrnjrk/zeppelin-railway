FROM dragory/zeppelin:latest
COPY railway-start.sh /railway-start.sh
COPY proxy.js /proxy.js
CMD ["sh", "/railway-start.sh"]
