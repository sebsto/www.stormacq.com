---
title:  "Running AWS AppSync clients on Android v5 and older"
subtitle: "How to configure TLSv1.1 and TLSv1.2?"
description: "Running AWS AppSync clients on Android v5 and older. How to configure TLSv1.1 and TLSv1.2?"
date: 2019-01-04 00:00:00 +0100
# categories: aws appsync
tags: [mobile, appsync, aws, android, tls, ssl]
author: Seb
background: '/img/posts/20190104/security.jpg'
images: ['/img/posts/20190104/security.jpg']
---

When developing mobile applications, supporting older devices is a common requirement, in particular for Android mobiles where the market is much more fragmented than on iOS.  <a href="https://developer.apple.com/support/app-store/" target="_blank">According to Apple</a>, 72% of the devices sold in the last 4 years are running iOS 12, while <a href="https://developer.android.com/about/dashboards/" target="_blank">according to Google</a>, only 21% of devices are running Android 8.x (Oreo).  On Android, you will need to support all versions back to Android 5.x (Lollipop) to reach 90% of the active devices.

One of the challenges doing so is to continue to use state-to-the-art network protocols on operating systems released several years ago, and not always maintained anymore.  For example, Android 5.x only supports TLSv1.0 and SSLv3 protocols by default, which <a href="https://blog.qualys.com/ssllabs/2014/12/08/poodle-bites-tls" target="_blank">have been proved to be insecure</a> since then.  Backend services, on the other side, now rely on TLSv1.2, in order to meet strict security requirements (<a href="https://threatpost.com/federal-agencies-told-to-support-tls-1-2-by-2015/105906/" target="_blank">NIST</a>, <a href="https://blog.pcisecuritystandards.org/are-you-ready-for-30-june-2018-sayin-goodbye-to-ssl-early-tls" target="_blank">PCI-DSS</a> are just two examples).

For example, AWS AppSync endpoints only offer TLSv1.1 and TLSv1.2 during the protocol negotiation. You can verify this using the ```nmap``` command, such as below:

```bash
$ nmap --script ssl-enum-ciphers <your_appsync_id>.appsync-api.eu-west-1.amazonaws.com

Starting Nmap 7.70 ( https://nmap.org ) at 2018-12-23 14:35 GMT
Nmap scan report for d7...33q.appsync-api.eu-west-1.amazonaws.com (13.xx.xx.43)
Host is up (0.033s latency).
Other addresses for d7...33q.appsync-api.eu-west-1.amazonaws.com (not scanned): 13.xx.xx.xx 13.xx.xx.xx 13.xx.xx.xx
rDNS record for 13.xx.xx.43: server-13-xx-xx-43.lhr62.r.cloudfront.net
Not shown: 998 filtered ports
PORT    STATE SERVICE
80/tcp  open  http
443/tcp open  https
| ssl-enum-ciphers:
|   TLSv1.1:
|     ciphers:
(skipped for brevity)
|   TLSv1.2:
|     ciphers:
(skipped for brevity)
|_  least strength: A
```


So, on the client side, you have <a href="https://github.com/square/okhttp/issues/1934" target="_blank">TLSv1.0 and SSLv3 by default</a>, while on the server side, you have TLSv1.1 and TLSv1.2.

On Android Lollipop, if you try <a href="https://github.com/awslabs/aws-mobile-appsync-sdk-android" target="_blank">to instantiate an AppSync client</a> using the default configuration, such as this :

```kotlin
// initialize the AppSync client
val appSyncClient = AWSAppSyncClient.builder()
        .context(applicationContext)
        .awsConfiguration(AWSConfiguration(applicationContext))
        .credentialsProvider(credentialsProvider)
        .build()
```

You will get a runtime error like the below:

```bash
12-23 15:07:04.414 2414-2431/com.stormacq.android.myapp W/RetryInterceptor: Encountered IO Exception making HTTP call [javax.net.ssl.SSLHandshakeException: javax.net.ssl.SSLProtocolException: SSL handshake aborted: ssl=0xb7e76370: Failure in SSL library, usually a protocol error
    error:14077410:SSL routines:SSL23_GET_SERVER_HELLO:sslv3 alert handshake failure (external/openssl/ssl/s23_clnt.c:741 0xa909d925:0x00000000)]
```

You'll need to write an extra bit of code to use TLSv1.1 or TLSv1.2 on Android 5.x. The good news is that TLSv1.1 and TLSv1.2 are available on Android 5.x, they are just not enabled by default.  

To enable these protocols, two steps are needed.

First, you will need to create your own <a href="https://developer.android.com/reference/javax/net/ssl/SSLSocketFactory" target="_blank">SSLSocketFactory</a> class.  This class' responsibility is to create and configure ~~SSL~~ TLS Sockets.  The <a href="https://github.com/sebsto/maxi-80-android-exoplayer2/blob/maxi80/Maxi80/src/main/java/com/stormacq/android/maxi80/TLSSocketFactory.kt" target="_blank">implementation</a> is mostly boilerplate code, with the exception of adding TLSv1.1 and TLSv1.2 in the list of supported protocols to new sockets.

```kotlin
socket.enabledProtocols = arrayOf("TLSv1.1", "TLSv1.2")
```

Second, you will need to tell AppSync Client to use that new SSLSocketFactory class instead of the default.  As AppSync Client is using <a href="https://github.com/square/okhttp/" target="_blank">OKHTTP</a> library behind the scene, you'll need first to create your own ``OKHttpClient`` and configure it to use your ``SSLSocketFactory`` class created just before.  Then you will provide AppSync Client with your own ``OkHttpClient``.  The code looks like this:

```kotlin
// tm is the trust manager, code to instantiate this is skipped for brevity
// let's create our own OKHttpClient and configure it to use our custom SSLSocketFactory
val okHTTPClient = OkHttpClient.Builder().sslSocketFactory(TLSSocketFactory(), tm).build()

// Tell the builder to use our own OK HTTP client
appSyncBuilder.okHttpClient(okHTTPClient) 
appSyncClient = appSyncBuilder.build()
```

Full code is available on <a href="https://github.com/sebsto/maxi-80-android-exoplayer2/blob/maxi80/Maxi80/src/main/java/com/stormacq/android/maxi80/Maxi80Application.kt#L96" target="_blank">GitHub</a>.

This is something you are likely to do only once, as one App Sync client object can be reused for all calls.  I am typically instantiating it the ``onCreate()`` method of the ``Application()`` object, or a bit later depending if your application identifies users or not.

Now you are ready to use AppSync client with TLSv1.1 and TLSv1.2 on Android 5.x or older.

Let me know your feedback on <a href="https://twitter.com/sebsto" target="_blank">Twitter</a>.
