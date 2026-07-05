# Reddit Ads: Discovery & Account Assessment

## Phase 1: Business & Account Discovery

Reddit nests ad accounts under businesses. Start here:

```python
reddit_ads_get_me()
reddit_ads_list_businesses()
```

- For each business, list its ad accounts: `reddit_ads_list_ad_accounts(business_id="<BUSINESS_ID>")`.
- If multiple businesses / accounts: ask the user to select one.
- If single: inform the user and proceed.
- Note the `ad_account_id` (often prefixed `t2_` or `a2_`) — it's required for most calls.

## Phase 2: Account Assessment

Run in parallel to understand the account state:

```python
reddit_ads_list_campaigns(ad_account_id="<AD_ACCOUNT_ID>")
reddit_ads_list_ad_groups(ad_account_id="<AD_ACCOUNT_ID>")
reddit_ads_list_ads(ad_account_id="<AD_ACCOUNT_ID>")
reddit_ads_list_funding_instruments(ad_account_id="<AD_ACCOUNT_ID>")
reddit_ads_list_pixels(ad_account_id="<AD_ACCOUNT_ID>")
reddit_ads_list_profiles(ad_account_id="<AD_ACCOUNT_ID>")
```

Then confirm: objective, daily/lifetime budget (convert dollars → micros), targeting (communities/interests/geo/devices), the post to promote, and — for conversion goals — that a pixel exists. Optionally call `reddit_ads_get_feature_access(ad_account_id=...)` to confirm which capabilities (e.g. CBO) the account supports.
