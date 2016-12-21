userAuth
========

User Authentication with Express.js, Passport, and MongoDB. Read the blog post [here] ().

# Summary

Updated this repo so that it runs on the [OpenShift](https://www.openshift.com/) platform.
This repo will be used to test/demo OAuth 2.0 authorization code/implicit grant types.  

It currently only implements the Implicit Grant Flow, but it can only be used if you have an Edge OAuth proxy that implements the implicit grant flows (/authorize and /token).

This repo will be listed as a submodule of https://github.com/swilliams11/apigee-android-app.  


### MongoDB
You must have a cloud hosted MongoDB application, as you can see from the `"mongodbHost" : "mongodb://USERNAME:PASSWORD@HOSTNAME:PORT/DBNAME"`.

If you don't have one, then try [Mlab](https://mlab.com), which allows you to create a free MongoDB instance.  

### Config.js
You must add a `config.js` file to the `userAuth` directory with the contents shown below.

```
// config.js
// This file contains private configuration details.
// Do not add it to your Git repository.
module.exports = {
  "mongodbHost" : "mongodb://USERNAME:PASSWORD@HOSTNAME:PORT/DBNAME",
  "org" : "apigeeorg",
  "env" : "apigeeenv",
  "apigeeDomain" : ".apigee.net",
  "clientId" : "clientId",
  "callbackUrl" : "https://login-openshiftorg.rhcloud.com/callback"
};
```

### OpenShift
I named my application `login` in OpenShift, so OpenShift created a private Github repository named `login`, which I then cloned to my local machine.

1. Fork this repository.
   * add the `config.js` file as mentioned above

2. Create an application in OpenShift with the Node.js (Latest) Quickstart cartridge and name it `login`.  
   * OpenShift will create the application and it will also create a Github repository.
   * Clone the OpenShift repository
   * Copy the contents of this repo to the OpenShift repository

3. Push the changes to OpenShift


#### OpenShift CLI
Install the [OpenShift Command line](https://developers.openshift.com/getting-started/).

* `rhc tail app_name`
  * e.g. `rhc tail login`
* `rhc ssh app_name`
  * e.g. `rhc ssh login`

#### Deploy an Application in OpenShift
To deploy an application, simply push the repository to OpenShift.

```
git clone {login repo}
cd login
git push
```

#### Test It
Copy the URI below and change the openshiftorg to the your domain and paste it into your browser.
```
https://login-{openshiftorg}.rhcloud.com/
```

You should see the image below.  

![Sample Home Page](/screenshots/homepage.png?raw=true "Sample Home Page")
