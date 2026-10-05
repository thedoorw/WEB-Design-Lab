# Modular Editorial Starter v0.1 — QA

STATUS = PASS
RUN_ID = 37315358965
ARTIFACT_ID = 11346948623
BRANCH = work/factory-modular-site-001

## Results

### Home desktop 1440×900
- PASS
- page override = 500px
- rendered reading width = 500px
- entries = 4
- promo = 1
- intro = 1
- overflow = 0
- boot/module errors = 0

### Start desktop 1440×900
- PASS
- site default = 540px
- rendered reading width = 540px
- richText = 1
- entries = 2
- overflow = 0
- boot/module errors = 0

### Archive desktop 1440×900
- PASS
- site default = 540px
- rendered reading width = 540px
- archiveList = 1
- overflow = 0
- boot/module errors = 0

### Home mobile 390×844
- PASS
- desktop page setting remains 500px
- responsive mobile setting = 330px
- rendered reading width = 330px
- overflow = 0

### Start mobile 390×844
- PASS
- desktop site default remains 540px
- responsive mobile setting = 330px
- rendered reading width = 330px
- overflow = 0

### Settings Preview
- PASS
- selecting 500px → preview width = 500px
- selecting 540px → preview width = 540px

## Decision

```text
SITE_SETTINGS = PROVEN
PAGE_SETTINGS_OVERRIDE = PROVEN
PAGE_RECIPE = PROVEN
CONTENT_MODULES = PROVEN
CONTENT_DATA_REFERENCES = PROVEN
SETTINGS_PREVIEW = PROVEN
MODULAR_EDITORIAL_v0.1 = PASS
```
