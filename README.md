userAuth
========

User Authentication with Express.js, Passport, and MongoDB. Read the blog post [here] ().

# Summary

Updated this repo so that it runs on the [OpenShift](https://www.openshift.com/) platform.
This repo will be used to test/demo OAuth 2.0 authorization code/implicit grant types.  

### Config.js
must add a `config.js` file to the `userAuth` directory as shown below.

```
// config.js
// This file contains private configuration details.
// Do not add it to your Git repository.
module.exports = {
  "mongodbHost" : "mongodb://USERNAME:PASSWORD@HOSTNAME:PORT/DBNAME"
};
```
