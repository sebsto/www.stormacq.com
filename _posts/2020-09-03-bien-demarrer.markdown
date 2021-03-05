---
layout: post
title:  "Bien démarrer sur AWS"
subtitle: "Une série de mini vidéos pour bien démarrer en 5 minutes chrono"
date: 2020-09-01 00:00:00 +0100
# categories: aws appsync
tags: [ec2, s3, aws, lambda]
author: Seb
background: '/img/posts/2020-09-01-bien-demarrer.jpg'
---

Vous trouverez ici un ensemble de mini vidéos, la plupart sous la barre des 5 minutes, pour répondre aux questions les plus fréquement posées sur AWS.

Votre question n'a pas de réponse dans la liste ci-dessous ? [Dites-le moi](mailto:stormacq@amazon.com) !

N'hésitez pas à chercher via des mots clés sur cette page.

https://youtu.be/_iBuMSUPZNk

--- 

| [Infrastructure Globale](#infrastructure-globale) | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | [Compte et facturation](#compte-et-facturation) 
| [Outils (Console, Ligne de Commande et SDK)](#outils-console-ligne-de-commande-et-sdk) | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | [Amazon IAM](#amazon-identity-and-access-management-iam) 
| [Amazon EC2](#amazon-elastic-compute-cloud-ec2) | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | [Amazon VPC](#amazon-virtual-private-cloud-vpc) 
| [Amazon EBS](#amazon-elastic-block-storage-ebs) | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | [Amazon CloudFront](#amazon-cloudfront) 
| [Elastic Load Balancer](#elastic-load-balancing-elb) | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |  [Amazon RDS](#amazon-relational-database-service-rds)
| [AWS Lambda](#aws-lambda) | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | [Amazon S3](#amazon-simples-torage-service-s3) 
| [**New:** Migration and Backup](#migration-and-backup) | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | [**New:** Desktop Computing](#desktop-computing) 

--- 

![video0](/img/posts/2020-09-03_video0.jpg)&nbsp;![video1](/img/posts/2020-09-03_video1.png)&nbsp;![video2](/img/posts/2020-09-03_video2.png)&nbsp;![video3](/img/posts/2020-09-03_video3.png)


<p/>
&nbsp;

#### Compte et Facturation 

- [Comment créer son compte AWS](https://www.youtube.com/watch?v=TjKu5iwr3x8&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=24){:target="_blank"} ?
- [Comment sécuriser son compte AWS juste après l'avoir créé](https://www.youtube.com/watch?v=Jk3bJODIVf8&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=25){:target="_blank"} ?
- [Comment rester dans les limites des essais gratuits](https://www.youtube.com/watch?v=qbxUI3TxFA4&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=26){:target="_blank"} ?
- [Comment les Saving Plans peuvent vous aider à économiser sur votre facture AWS](https://www.youtube.com/watch?v=MmZCFxoxdbc&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=27){:target="_blank"} ?
- [Les fonctions AWS Lambda, combien ca coûte](https://www.youtube.com/watch?v=k_pGl8OMKpE&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=32){:target="_blank"} ?


<p/>
&nbsp;

#### Infrastructure Globale 

- [C'est quoi une région, une zone de disponibilité](https://www.youtube.com/watch?v=RxWPIcuj6lQ&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU){:target="_blank"} ?

<p/>
&nbsp;

#### Outils (Console, Ligne de commande et SDK) 

- [Comment installer et configurer la ligne de commande (CLI) AWS](https://www.youtube.com/watch?v=V63ZzExqQIw&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=3){:target="_blank"} ? 
- [Comment utiliser la ligne de commande (CLI) AWS](https://www.youtube.com/watch?v=c7BnfiMSB4Y&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=4){:target="_blank"}  ?
- [Comment les SDKs peuvent vous faciliter la vie](https://www.youtube.com/watch?v=q0zeFK2LWPY&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=5){:target="_blank"} ?

<p/>
&nbsp;

#### Amazon Identity and Access Management (IAM) 

- [Comment sécuriser son compte root](https://www.youtube.com/watch?v=29qidFrp0fs&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=10){:target="_blank"} ?
- [Comment gèrer les permissions de votre équipe](https://www.youtube.com/watch?v=ZMHlBza1l1A&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=11){:target="_blank"} ?
- [Comment autoriser sa machine virtuelle à accèder d'autres services AWS](https://www.youtube.com/watch?v=V_-rudjXAXI&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=29){:target="_blank"} ? (avec des rôles IAM)

<p/>
&nbsp;

### Amazon Virtual Private Cloud (VPC)

- [Comment créer son réseau privé sur AWS](https://www.youtube.com/watch?v=5ZrDBWP0Okw&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=23){:target="_blank"} ?
- [Comment configurer un Security Group](https://www.youtube.com/watch?v=QwhexkU2ya4&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=13){:target="_blank"} ?

<p/>
&nbsp;

#### Amazon Elastic Compute Cloud (EC2)

- [Comment lancer une machine virtuelle Linux](https://www.youtube.com/watch?v=ZbGDmznG0iw&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=22){:target="_blank"} ?}
- [Comment lancer une machine virtuelle Windows](https://www.youtube.com/watch?v=aARcLxcGJaU&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=21){:target="_blank"} ?
- [Comment conserver la même adresse IP après un reboot](https://www.youtube.com/watch?v=oSMEQlQDohM&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=12){:target="_blank"} ?
- [Comment arrêter sa machine virtuelle](https://www.youtube.com/watch?v=Vd6X4DlxghQ&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=20){:target="_blank"} ?
- [Comment faire une image de sa machine virtuelle](https://www.youtube.com/watch?v=xjZx37dsVRw&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=28){:target="_blank"} ?
- [Comment autoriser sa machine virtuelle à accèder d'autres services AWS](https://www.youtube.com/watch?v=V_-rudjXAXI&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=29){:target="_blank"} ? (avec des rôles IAM)
- [Les instances de la famille T, le mode turbo](https://www.youtube.com/watch?v=FYkjT20Cric&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=30){:target="_blank"} ?
- [Comment configurer vos machines virtuelles automatiquement quand elles démarent](https://www.youtube.com/watch?v=iivacbYmQ-0&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=40){:target="_blank"} ?
- [Comment redémarrer automatiquement vos machines virtuelles en cas de panne](https://www.youtube.com/watch?v=f7WMawmVz6k&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=41){:target="_blank"} ?
- [Comment configurer AutoScaling pour redimensionner votre infrastructure automatiquement](https://www.youtube.com/watch?v=NuYTRLt4dMA&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=42){:target="_blank"} ?
- **NEW** [Comment démarrer son Active Directory géré ?](https://www.youtube.com/watch?v=uBHkHKWE5jk&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=4){:target="_blank"}
- **NEW** [Comment configurer une instance EC2 Windows pour rejoindre un domaine manuellement ?](https://www.youtube.com/watch?v=YPN7nZeuzK0&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=2){:target="_blank"}
- **NEW** [Comment configurer une instance EC2 Windows pour rejoindre un domaine automatiquement ?
](https://www.youtube.com/watch?v=kPiMFHqF8bg&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=3)


<p/>
&nbsp;

#### Amazon Elastic Block Storage (EBS)

- [Comment utiliser EBS, le stockage haute performance pour vos machines virtuelles](https://www.youtube.com/watch?v=cNaiezlLdgU&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=14){:target="_blank"} ?
- [Comment attacher un volume à une machine virtuelle sous Linux](https://www.youtube.com/watch?v=xt4SZzRHA5w&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=15){:target="_blank"} ?
- [Comment attacher un volume à une machine virtuelle sous Windows](https://www.youtube.com/watch?v=TJgwJ0qB-Ss&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=16){:target="_blank"} ?
- [Comment changer la taille d'un volume sous Linux](https://www.youtube.com/watch?v=Dg-_8J48_Jc&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=17){:target="_blank"} ?
- [Comment changer la taille d'un volume sous Window](https://www.youtube.com/watch?v=nMDiEka4Jgg&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=18){:target="_blank"} ?
- [Comment faire un snapshot pour restaurer ma machine virtuelle](https://www.youtube.com/watch?v=3nRWtPDtW_c&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=19){:target="_blank"} ?

<p/>
&nbsp;

#### Elastic Load Balancing (ELB)

- [Comment créer votre répartisseur de charge (load balancer)](https://www.youtube.com/watch?v=66vwXpmK9NI&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=44){:target="_blank"} ?
- [Comment réaliser un déployement blue/green à l'aide des load balancers](https://www.youtube.com/watch?v=NxbDHn5ryc8&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=43){:target="_blank"} ?

<p/>
&nbsp;

#### AWS Lambda

- [C'est quoi une fonction AWS Lambda](https://www.youtube.com/watch?v=JEv8_tMdgNk&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=33){:target="_blank"} ?
- [Comment créer ma première fonction AWS Lambda](https://www.youtube.com/watch?v=xQ5Grs3KLJk&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=31){:target="_blank"} ?
- [Les fonctions AWS Lambda, combien ca coûte](https://www.youtube.com/watch?v=k_pGl8OMKpE&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=32){:target="_blank"} ?
- [Comment utiliser les logs des fonctions AWS Lambda](https://www.youtube.com/watch?v=It-B-X2NuUg&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=34){:target="_blank"} ?
- [Comment mettre une API REST devant ses fonctions AWS Lambda](https://www.youtube.com/watch?v=ykPVzUvcLk4&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=35){:target="_blank"} ?
- [Comment invoquer une fonction AWS Lambda](https://www.youtube.com/watch?v=Wopa3G5t96o&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=36){:target="_blank"} ?
- [Comment invoquer une fonction AWS Lambda à intervalles réguliers](https://www.youtube.com/watch?v=W6qE_U7nEs0&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=37){:target="_blank"} ?
- [Comment utiliser des variables d'environnements dans vos fonctions AWS Lambda](https://www.youtube.com/watch?v=T76BhyVtBUk&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=38){:target="_blank"} ?
- [Comment créer plusieurs version de ses fonctions AWS Lambda](https://www.youtube.com/watch?v=VpiDZ7lN8LI&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=39){:target="_blank"} ?

<p/>
&nbsp;

#### Amazon Simple Storage Service (S3)

- [Comment Stocker ses données sur Amazon S3](https://www.youtube.com/watch?v=4RI3pDKpx38&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=9){:target="_blank"} ?
- [Comment utiliser Amazon S3 depuis votre ligne de commande](https://www.youtube.com/watch?v=qBiJd-CpqI4&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=2){:target="_blank"} ?
- [Comment utiliser Amazon S3 depuis la console AWS](https://www.youtube.com/watch?v=y9DfZWGmqaY&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=8){:target="_blank"} ?
- [Comment héberger ses sites web statiques sur Amazon S3](https://www.youtube.com/watch?v=-UZH_B2o7YY&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=6){:target="_blank"} ?

<p/>
&nbsp;

#### Amazon Relational Database Service (RDS)

- [Comment créer une base de données relationelle sur AWS](https://www.youtube.com/watch?v=adB--KhJ95w&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=47){:target="_blank"} ?
- [Comment connectez mes applcations à une base de données relationnelle sous Amazon RDS](https://www.youtube.com/watch?v=48SW96Obb-M&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=49){:target="_blank"} ?
- [Comment gèrer vos bases de données relationelles](https://www.youtube.com/watch?v=LRBkGdKyH_4&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=48){:target="_blank"} ?
- [Comment gèrer vos copies de sauvegarde de vos bases de données](https://www.youtube.com/watch?v=ltfO923DYAA&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=46){:target="_blank"} ?
- [Comment créer une base de donnée copie en mode mirroir](https://www.youtube.com/watch?v=zdUvPD8Xu1o&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=45){:target="_blank"} ?

<p/>
&nbsp;

#### Amazon CloudFront

- [Comment distribuer son contenu sur AWS](https://www.youtube.com/watch?v=5AbIzH7Q3ZA&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=7){:target="_blank"} ?

<p/>
&nbsp;

#### Migration and Backup

- [Comment faire des copies de sauvegarde de vos instances Amazon EC2 avec AWS Backup ?](https://www.youtube.com/watch?v=axyMcPYUeVs&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=5){:target="_blank"}
- [Comment mettre en place un Disaster Recovery avec CloudEndure ?](https://www.youtube.com/watch?v=x5QIXpwgKCo&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=6){:target="_blank"}
- [Comment mettre son centre d'appel dans le cloud ?](https://www.youtube.com/watch?v=5dxq6i6wvnY&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=7){:target="_blank"}

<p/>
&nbsp;

#### Desktop Computing

- [Diffuser vos apps depuis le cloud avec AppStream, partie 1/3](https://www.youtube.com/watch?v=uP1aCH5euU8&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=10)
- [Diffuser vos apps depuis le cloud avec AppStream, partie 2/3](https://www.youtube.com/watch?v=3MvP1Gh8XCY&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=9)
- [Diffuser vos apps depuis le cloud avec AppStream, partie 3/3](https://www.youtube.com/watch?v=ySs40HH6x7I&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=8)
- [Héberger vos desktops dans le cloud, partie 1/2](https://www.youtube.com/watch?v=U_OC2Zbknac&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=12)
- [éberger vos desktops dans le cloud, partie 2/2](https://www.youtube.com/watch?v=5RR3v6SiHVE&list=PLL_L4MF1Z7JW_-LW4ikJsgF2EIfpOp-IU&index=11)
