# Exactly what .github/workflows/validate-submission.yml runs, locally.
#
# Needs the harness on PATH:  pip install -e ../skillshift-bench

.PHONY: help check preview naming

SUBMISSIONS ?= submissions
ENVS        ?= ../skillshift-envs
DIGESTS     := $(ENVS)/DIGESTS.json

help:
	@echo "make check              run the five checks over every submission"
	@echo "make preview NEW=<file> render the pull-request comment for one submission"
	@echo "make naming             check filenames and dates only"

# The digest comparison is passed through only when there is something to
# compare against; see the 'Decide digest strictness' step in the workflow.
DIGEST_ARGS = $(shell \
	if [ -f "$(DIGESTS)" ] && jq -e '[to_entries[] | select(.value != null)] | length > 0' "$(DIGESTS)" > /dev/null 2>&1; \
	then echo "--digests $(DIGESTS)"; fi)

check:
	@if [ -z "$(DIGEST_ARGS)" ]; then \
		echo "LENIENT: no published image digests in $(DIGESTS); receipt env_digests are not verified."; \
		echo ""; \
	fi
	@set -e; for file in $(SUBMISSIONS)/*.json; do \
		case "$$file" in *.receipt.json) continue;; esac; \
		receipt="$${file%.json}.receipt.json"; \
		echo "== $$file"; \
		if [ -f "$$receipt" ]; then \
			skillshift validate "$$file" --receipt "$$receipt" $(DIGEST_ARGS); \
		else \
			skillshift validate "$$file" $(DIGEST_ARGS); \
		fi; \
		echo ""; \
	done
	@$(MAKE) --no-print-directory naming

naming:
	skillshift leaderboard check $(SUBMISSIONS) $(DIGEST_ARGS)

preview:
	@test -n "$(NEW)" || { echo "usage: make preview NEW=submissions/<file>.json"; exit 2; }
	skillshift leaderboard check $(SUBMISSIONS) --new $(NEW) $(DIGEST_ARGS)
