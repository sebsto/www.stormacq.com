DISTRIBUTION_ID = E3MEG4UBSP7M9Y
AWS_PROFILE = default

deploy:
	aws codepipeline start-pipeline-execution \
		--name sebinthecloud-v2 \
		--region eu-central-1 \
		--profile $(AWS_PROFILE) \
		--output json

invalidate:
	aws cloudfront create-invalidation \
		--distribution-id $(DISTRIBUTION_ID) \
		--paths "/" "/index.html" "/posts/" "/posts/index.html" "/feed.xml" "/2026/*" \
		--profile $(AWS_PROFILE) \
		--output json

serve:
	container run \
		-p 1313:1313 \
		--rm -it \
		-v $(PWD):/project \
		ghcr.io/gohugoio/hugo:v0.157.0 \
		server --bind 0.0.0.0 --poll 700ms -D
