# Fast path: official published image.
# Entrypoint accepts: migrate | api | bot | dashboard
# Set a different start command per Railway service.
#
# Pin a digest/tag in production if you need reproducible deploys:
#   FROM dragory/zeppelin:latest
FROM dragory/zeppelin:latest
