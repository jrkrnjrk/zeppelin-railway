FROM dragory/zeppelin:latest
COPY railway-start.sh /railway-start.sh
COPY proxy.js /proxy.js
COPY inject-staff-logs.js /inject-staff-logs.js
ENTRYPOINT ["sh", "/railway-start.sh"]
