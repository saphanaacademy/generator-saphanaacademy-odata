# generator-saphanaacademy-odata [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> Yeoman Generator to create SAP HANA OData services

## Installation

First, install [Yeoman](http://yeoman.io) and generator-saphanaacademy-odata using [npm](https://www.npmjs.com/)

```bash
npm install -g yo
npm install -g generator-saphanaacademy-odata
```
We assume you have pre-installed [node.js](https://nodejs.org/) and the [Cloud Foundry CLI](https://github.com/cloudfoundry/cli) with the [multiapps](https://github.com/cloudfoundry-incubator/multiapps-cli-plugin) plugin.) In order to build the project ensure [@sap/cds-dk](https://www.npmjs.com/package/@sap/cds-dk) and [Cloud MTA Build Tool (MBT)](https://sap.github.io/cloud-mta-build-tool/) are installed. This is already the case for SAP Business Application Studio.

Ensure you have a SAP HANA instance (with the ip address of your workstation in the allowlist) and know the endpoint, credentials and schema name.

Also ensure that you are logged in to the Cloud Foundry CLI and are targeting the org and space into which you want to deploy the project - the generator will create a user defined service for you in this org and space.

Then generate your new project:

```bash
yo saphanaacademy-odata
```

OData services will be created for all tables and views found in the given schema.

SAP HANA is powerful and flexible and it's impossible to cover all the possibilities. It may be necessary to adjust the project to support certain scenarios to, for example, support table sequences, views with parameters, add a more sophisticated UI etc. In this case, don't tell Yeoman to build and deploy the project and instead do it yourself once your adjustments have been made.

## Getting To Know Yeoman

 * Yeoman has a heart of gold.
 * Yeoman is a person with feelings and opinions, but is very easy to work with.
 * Yeoman can be too opinionated at times but is easily convinced not to be.
 * Feel free to [learn more about Yeoman](http://yeoman.io/).

## License

Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, Version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.

[npm-image]: https://badge.fury.io/js/generator-saphanaacademy-odata.svg
[npm-url]: https://npmjs.org/package/generator-saphanaacademy-odata
[travis-image]: https://travis-ci.com/saphanaacademy/generator-saphanaacademy-odata.svg?branch=master
[travis-url]: https://travis-ci.com/saphanaacademy/generator-saphanaacademy-odata
[daviddm-image]: https://david-dm.org/saphanaacademy/generator-saphanaacademy-odata.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/saphanaacademy/generator-saphanaacademy-odata
