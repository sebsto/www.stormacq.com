---
layout: post
title:  "Blogging without servers"
subtitle: "Why I migrated this blog to a serverless architecture."
date:   2018-10-17 19:15:49 +0100
# categories: serverless
tags: [serverless, migration, s3, jekyll]
author: Seb
background: '/img/posts/2018-10-17-migrated-to-serverless.jpg'
---

This week I migrated my 13 years old [Wordpress][wordpress.org] blog to a serverless architecture.  Here is why.  

The first version of the blog, between 2005 and 2013, was hosted at [Dreamhost][dreamhost.com].  Since I joined AWS in 2013, I migrated it to a simple cloud-based architecture : one [Amazon EC2][ec2] instance, one [Amazon RDS][rds] MySQL database and an [Amazon CloudFront][cloudfront] distribution, coupled with some [AWS Web Application Firewall][waf] rules to filter out the bulk of unwanted traffic. I developed a couple of scripts to backup the AMI and collect logs with [Cloudwatch][cloudwatch], created alarms to be alerted about unusual events etc ... Maintenance was minimal, my job was just to keep Linux, Apache, Wordpress up-to-date and monitoring the occasional alarms. But this was still too much for me, on top of my professional and family life. 

So, I decided to get rid of Wordpress, and to host this blog using static HTML files instead.  This new version is hosted on Amazon [S3][s3], using Amazon Cloudfront as CDN.  No more Linux or Wordpress to patch, and pages are loading much faster.

In addition, I expect a major reduction of my personal AWS bill.  An on-demand ``t2.micro`` EC2 instance in Frankfurt (``eu-central-1``) is ~$10/month and an on-demand ``db.t2.micro`` RDS instance in Frankfurt, including storage for the backups, is about $17/month, for a total of *$27/month*.  As I was using reserved instances, my real cost was lower than that (EC2 $4.5/month and RDS $6/month for 3 years reserved instance, upfront).  The new cost will be limited to S3 storage (I don't even have half a giga), S3 requests and the Cloudfront requests & outgoing bandwidth.  I expect the new total *to be less than $1/month*.

Here are the tools I used for the migration :

- I exported the existing content from Wordpress to static files using [HTTrack][httrack]
- I created an S3 bucket and CloudFront distribution 
- I configured Route 53 DNS to point to CloudFront.  Bucket is private.  CloudFront uses ``origin-access-identity`` to access to S3
- I am using [Jekyll][jekyll] to generate and maintain the new HTML web pages, with an updated [look & feel][startbootstrap] (the old one is 13 years old !) 
- I wrote a couple of [SQL queries][athena_cfn_logs] to analyse Cloudfront logs using [Amazon Athena][athena]
- the best part was to terminate the EC2 instance, and to delete the database.  I obviously backup a last AMI and RDS Snapshot before doing so :-) 

These are a few easy steps to follow to simplify your architecture and reduce your hosting costs to less than a price of a cup of coffee ... per month !

**UPDATE October 20th 2018**

After a couple of days, I noticed many S3 ``403 Forbidden`` errors in Cloudfront logs.  I realized some of my old blog articles are being referenced from other locations and they do receive hourly traffic.  Unfortunately, the new blog, the one generated with Jekyll, is hosted at the root ``/`` and the old Wordpress site is hosted at ``/old/``, so I had to provide a redirection for these old permalinks to the new ``/old/`` structure.  I wrote 10 lines of Javascript to take care of that and hosted this as a [Lambda @ Edge][lambda@edge] funtion, invoked by Cloudfront when content is sent back from S3.  In case of an S3 403 error code and a matching URI pattern, the Lambda function sends a ``301 Permanently Moved`` redirect order to the new location.

[dreamhost.com]: https://www.dreamhost.com/hosting/shared/
[wordpress.org]: https://wordpress.org
[ec2]: https://aws.amazon.com/ec2/
[rds]: https://aws.amazon.com/rds/
[cloudfront]: https://aws.amazon.com/cloudfront/
[s3]: https://aws.amazon.com/s3/
[waf]: https://aws.amazon.com/waf/
[cloudwatch]: https://aws.amazon.com/cloudwatch
[httrack]: [https://www.httrack.com/]
[jekyll]: https://jekyllrb.com/
[startbootstrap]: https://github.com/BlackrockDigital/startbootstrap-clean-blog-jekyll/
[athena]: https://aws.amazon.com/athena/
[athena_cfn_logs]:https://docs.aws.amazon.com/athena/latest/ug/cloudfront-logs.html
[lambda@edge]: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-at-the-edge.html