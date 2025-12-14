# v0.0.19

[2022-10-10]

### Fixes

- bulk send mail logic &lt;= length ([`1c7fe73`](http://bitbucket.org/heilandit/email_api/commits/1c7fe73f213701838ceac4bd4390dfa5924189e7))

# v0.0.18

[2022-08-22]

### Features

- sam template - functions use global vpc config for staging/prod ([`16bfe35`](http://bitbucket.org/heilandit/email_api/commits/16bfe35ea03e9b0c7ff8dce2f094a08fe4e6130a))

# v0.0.17

[2022-08-09]

### Features

- send bulk mail via aws ses SendBulkTemplatedEmailCommand (used by product-subscription-api)) ([`622b9e0`](http://bitbucket.org/heilandit/email_api/commits/622b9e0056d11732b9175a9d30cd391087b381be))
- [IT-2](https://heiland.atlassian.net/browse/IT-2) - - sam template use custom subdomain ([`72e461a`](http://bitbucket.org/heilandit/email_api/commits/72e461ab9015a26328feb430e5f3720c8b311775))
- [IT-5](https://heiland.atlassian.net/browse/IT-5) - - pipeline wait for cloud formation response ([`0c62959`](http://bitbucket.org/heilandit/email_api/commits/0c62959b59ecb4e3250770601810260d58ed2c00))

# v0.0.16

[2022-08-08]

### Fixes

- reference request body template data ([`c408d39`](http://bitbucket.org/heilandit/email_api/commits/c408d39227a3d91b1af70a4a24a40c0295efd176))

# v0.0.15

[2022-08-08]

### Fixes

- body validation ([`65619b1`](http://bitbucket.org/heilandit/email_api/commits/65619b1ecbc4ffd5a50e61627c5697aa94e13974))

# v0.0.14

[2022-08-08]

### Features

- post - it's possible to send text and html directly without template ([`d8d39d2`](http://bitbucket.org/heilandit/email_api/commits/d8d39d2839f9363768213d22ef724e69530a7008))
- post - add csv attatchement support ([`80a80b7`](http://bitbucket.org/heilandit/email_api/commits/80a80b7d2ff5db346bec6e11f516935c07d062cf))
- post - add csv options to define headers ([`cf4dcdc`](http://bitbucket.org/heilandit/email_api/commits/cf4dcdc68cf66a665da3daaea237c0d29cae382f))

### Fixes

- build csv header with json array ([`1fdf055`](http://bitbucket.org/heilandit/email_api/commits/1fdf055af2a1c0cccce3f07d2666c362d2664efa))

# v0.0.13

[2022-07-21]

### Features

- update npm packages ([`869c815`](http://bitbucket.org/heilandit/email_api/commits/869c815951220117079a7026f28f536ba90fb6ce))
- update @heiland_lambdas/lambda_lib_helper to 2.1.0 and use initizalize-handler instead of local ([`4541483`](http://bitbucket.org/heilandit/email_api/commits/45414835d796a47eb44438b54f2be90dbbc48eca))

### Fixes

- refactor generify initialize handler ([`087ec4c`](http://bitbucket.org/heilandit/email_api/commits/087ec4c120545e70217cc67d90ebfbe08860878b))

# v0.0.12

[2022-07-06]

### Fixes

- nullPointer on try reading event.headers but the call comes from step function without request header ([`a6e0d8d`](http://bitbucket.org/heilandit/email_api/commits/a6e0d8d0fb0bb587219c22a37ac456f56ff0c8f1))

# v0.0.11

[2022-07-05]
