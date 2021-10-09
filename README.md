# A CloudFlare worker to generate shareable Tweets

This worker takes requests, and the puts together a list of tweets from one
Airtable, and a list of targets from another Airtable. It combines them randomly.

## Tweets

In this case, the tool is for the [#StopCambo](https://stopcambo.org.uk)
campaign. You can see the list of tweets in [this airtable](https://airtable.com/shrm8DQQlhpqOEr7U).

Each tweet has @INSERTMP in it, which is replaced by the target handle.

## Targets

The targets are in another Airtable, in this case the Tory MPs with twitter.

[You can see them here](https://airtable.com/shrcRPrywXrXFE8rj).
