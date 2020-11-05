"use strict";
const Generator = require("yeoman-generator");
const path = require("path");
const glob = require("glob");

module.exports = class extends Generator {
  prompting() {
    return this.prompt([
      {
        type: "input",
        name: "projectName",
        message: "What project name would you like?",
        validate: (s) => {
          if (/^[a-zA-Z0-9_-]*$/g.test(s)) {
            return true;
          }
          return "Please only use alphanumeric characters for the project name.";
        },
        default: "myappodata",
      },
      {
        type: "confirm",
        name: "newDir",
        message: "Would you like to create a new directory for this project?",
        default: true
      },
      {
        type: "input",
        name: "hanaEndpoint",
        message: "What is your HANA endpoint?",
        default: "<guid>.hana.<region>.hanacloud.ondemand.com:443"
      },
      {
        type: "input",
        name: "hanaUser",
        message: "What is your HANA user name?"
      },
      {
        type: "password",
        name: "hanaPassword",
        message: "What is the password for your HANA user?"
      },
      {
        type: "input",
        name: "schemaName",
        message: "What is your HANA schema name? Note: schema names in mixed case are case sensitive!"
      },
      {
        type: "confirm",
        name: "v2support",
        message: "Would you like to enable OData v2 support?",
        default: true
      },
      {
        type: "confirm",
        name: "auth",
        message: "Would you like to enable authentication and authorization?",
        default: true
      },
      {
        type: "confirm",
        name: "buildDeploy",
        message: "Would you like to build and deploy the project?",
        default: false
      },
    ]).then((answers) => {
      // convert to uppercase if all lowercase
      if (answers.schemaName === answers.schemaName.toLowerCase()) {
        answers.schemaName = answers.schemaName.toUpperCase();
      }
      if (answers.newDir) {
        this.destinationRoot(`${answers.projectName}`);
      }
      this.config.set(answers);
    });
  }

  writing() {
    var done = this.async();
    var answers = this.config;
    var fs = this.fs;
    var destinationRoot = this.destinationRoot();
    var prefix = answers.get('projectName') + '_' + answers.get('schemaName');

    // scaffold the project
    this.sourceRoot(path.join(__dirname, "templates"));
    glob
      .sync("**", {
        cwd: this.sourceRoot(),
        nodir: true,
        dot: true
      })
      .forEach((file) => {
        if (!(file.includes('.DS_Store'))) {
          if (!(file === 'srv/server.js' && answers.get('v2support') === false)) {
            if (!(file === 'xs-security.json' && answers.get('auth') === false)) {
              if (!(file.substring(0, 4) === 'app/' && answers.get('auth') === false)) {
                const sOrigin = this.templatePath(file);
                if (file === 'db/src/SCHEMA.hdbgrants') {
                  file = 'db/src/' + answers.get('schemaName') + '.hdbgrants';
                }
                const sTarget = this.destinationPath(file);
                this.fs.copyTpl(sOrigin, sTarget, this.config.getAll());
              }
            }
          }
        }
      });

    // generate password for HANA technical user
    var pwdgen = require('generate-password');
    var grantorPassword = pwdgen.generate({
      length: 30,
      numbers: true
    });

    // connect to HANA to obtain metadata for tables in schema, scaffold project files & create technical user and roles
    var hana = require('@sap/hana-client')
    var connOptions = {
      serverNode: answers.get('hanaEndpoint'),
      encrypt: 'true',
      sslValidateCertificate: 'true',
      ssltruststore: '-----BEGIN CERTIFICATE-----MIIDrzCCApegAwIBAgIQCDvgVpBCRrGhdWrJWZHHSjANBgkqhkiG9w0BAQUFADBhMQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBDQTAeFw0wNjExMTAwMDAwMDBaFw0zMTExMTAwMDAwMDBaMGExCzAJBgNVBAYTAlVTMRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3dy5kaWdpY2VydC5jb20xIDAeBgNVBAMTF0RpZ2lDZXJ0IEdsb2JhbCBSb290IENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4jvhEXLeqKTTo1eqUKKPC3eQyaKl7hLOllsBCSDMAZOnTjC3U/dDxGkAV53ijSLdhwZAAIEJzs4bg7/fzTtxRuLWZscFs3YnFo97nh6Vfe63SKMI2tavegw5BmV/Sl0fvBf4q77uKNd0f3p4mVmFaG5cIzJLv07A6Fpt43C/dxC//AH2hdmoRBBYMql1GNXRor5H4idq9Joz+EkIYIvUX7Q6hL+hqkpMfT7PT19sdl6gSzeRntwi5m3OFBqOasv+zbMUZBfHWymeMr/y7vrTC0LUq7dBMtoM1O/4gdW7jVg/tRvoSSiicNoxBN33shbyTApOB6jtSj1etX+jkMOvJwIDAQABo2MwYTAOBgNVHQ8BAf8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUA95QNVbRTLtm8KPiGxvDl7I90VUwHwYDVR0jBBgwFoAUA95QNVbRTLtm8KPiGxvDl7I90VUwDQYJKoZIhvcNAQEFBQADggEBAMucN6pIExIK+t1EnE9SsPTfrgT1eXkIoyQY/EsrhMAtudXH/vTBH1jLuG2cenTnmCmrEbXjcKChzUyImZOMkXDiqw8cvpOp/2PV5Adg06O/nVsJ8dWO41P0jmP6P6fbtGbfYmbW0W5BjfIttep3Sp+dWOIrWcBAI+0tKIJFPnlUkiaY4IBIqDfv8NZ5YBberOgOzW6sRBc4L0na4UU+Krk2U886UAb3LujEV0lsYSEY1QSteDwsOoBrp+uvFRTp2InBuThs4pFsiv9kuXclVzDAGySj4dzp30d8tbQkCAUw7C29C79Fv1C5qfPrmAESrciIxpg0X40KPMbp1ZWVbd4=-----END CERTIFICATE-----',
      uid: answers.get('hanaUser'),
      pwd: answers.get('hanaPassword')
    };
    let connection = hana.createConnection();
    connection.connect(connOptions, function (err) {
      if (err) {
        return console.error(err);
      }
      let sql = "SELECT 'T' AS object_type, table_name as object_name FROM tables WHERE schema_name='" + answers.get('schemaName') + "' AND is_system_table='FALSE' AND is_temporary='FALSE' UNION SELECT 'V' AS object_type, view_name as object_name FROM views WHERE schema_name='" + answers.get('schemaName') + "'";
      connection.exec(sql, function (err, resObjects) {
        if (err) {
          return console.error(err);
        }
        if (resObjects.length < 1) {
          return console.error("No tables or views found in schema " + answers.get('schemaName'));
        }
        // create synonyms
        let hdbSynonym = "{";
        let i = 0;
        resObjects.forEach(element => {
          if (i) hdbSynonym += ",";
          hdbSynonym += '"' + answers.get('projectName') + '.db::' + answers.get('schemaName') + '.' + element.OBJECT_NAME + '": {"target": {"object":"' + element.OBJECT_NAME + '","schema":"' + answers.get('schemaName') + '"}}';
          i++;
        });
        hdbSynonym += "}";
        sql = "SELECT 'T' AS object_type, table_name as object_name, column_name, data_type_name, length, scale, is_nullable, default_value, position FROM table_columns WHERE schema_name='" + answers.get('schemaName') + "' AND table_name IN(''";
        resObjects.forEach(element => {
          if (element.OBJECT_TYPE === "T") {
            sql += ",'" + element.OBJECT_NAME + "'";
          }
        });
        sql += ") UNION SELECT 'V' AS object_type, view_name as object_name, column_name, data_type_name, length, scale, is_nullable, default_value, position FROM view_columns WHERE schema_name='" + answers.get('schemaName') + "' AND view_name IN(''";
        resObjects.forEach(element => {
          if (element.OBJECT_TYPE === "V") {
            sql += ",'" + element.OBJECT_NAME + "'";
          }
        });
        sql += ") ORDER BY object_name, position";
        connection.exec(sql, function (err, resColumns) {
          if (err) {
            return console.error(err);
          }
          // create hdbview for each object
          var hdbViews = [];
          resObjects.forEach(elementO => {
            let hdbView = "VIEW " + answers.get('projectName').toUpperCase() + "_DB_" + answers.get('schemaName').toUpperCase() + "_" + (elementO.OBJECT_NAME).toUpperCase() + " AS SELECT";
            let i = 0;
            resColumns.forEach(elementC => {
              if (elementC.OBJECT_NAME === elementO.OBJECT_NAME) {
                if (i) hdbView += ",";
                if (elementC.COLUMN_NAME !== (elementC.COLUMN_NAME).toUpperCase()) {
                  hdbView += ' "' + elementC.COLUMN_NAME + '" AS ' + (elementC.COLUMN_NAME).toUpperCase();
                } else {
                  hdbView += " " + elementC.COLUMN_NAME;
                }
                i++;
              }
            });
            hdbView += ' FROM "' + answers.get('projectName') + '.db::' + answers.get('schemaName') + '.' + elementO.OBJECT_NAME + '"';
            var view = { "NAME": elementO.OBJECT_NAME, "VIEW": hdbView };
            hdbViews.push(view);
          });
          let sql = "SELECT table_name as object_name, column_name, position, is_primary_key FROM constraints WHERE schema_name='" + answers.get('schemaName') + "' AND table_name IN(''";
          resObjects.forEach(element => {
            if (element.OBJECT_TYPE === "T") {
              sql += ",'" + element.OBJECT_NAME + "'";
            }
          });
          sql += ") ORDER BY table_name, position";
          connection.exec(sql, function (err, resConstraints) {
            if (err) {
              return console.error(err);
            }
            // create facade entity for each view
            let schemaCDS = "namespace " + answers.get('projectName') + ".db; context " + answers.get('schemaName') + " {";
            resObjects.forEach(elementO => {
              schemaCDS += " @cds.persistence.exists entity " + elementO.OBJECT_NAME;
              /* view parameters not supported yet: need to include in hdbview, schema.cds and cat-service.cds
              //let sql = "SELECT view_name as object_name, parameter_name, data_type_name, length, scale, has_default_value, position FROM view_parameters WHERE schema_name='" + answers.get('schemaName') + "' AND view_name IN(";
                // add any view parameters
                i = 0;
                resParameters.forEach(elementP => {
                  console.log(elementP.OBJECT_NAME,elementO.OBJECT_NAME);
                  if (elementP.OBJECT_NAME === elementO.OBJECT_NAME) {
                    if (i) {
                      schemaCDS += ",";
                    } else {
                      schemaCDS += " (";
                    }
                    schemaCDS += elementP.PARAMETER_NAME + " : ";
                    switch (elementP.DATA_TYPE_NAME) {
                      case "BOOLEAN": schemaCDS += "Boolean"; break;
                      case "TINYINT":
                      case "SMALLINT":
                      case "INTEGER": schemaCDS += "Integer"; break;
                      case "BIGINT": schemaCDS += "Integer64"; break;
                      case "REAL":
                      case "DOUBLE": schemaCDS += "Double"; break;
                      case "SMALLDECIMAL":
                      case "DECIMAL": schemaCDS += "Decimal(" + elementP.LENGTH + "," + elementP.SCALE + ")"; break;
                      case "DATE": schemaCDS += "Date"; break;
                      case "TIME": schemaCDS += "Time"; break;
                      case "TIMESTAMP": schemaCDS += "Timestamp"; break;
                      case "CHAR":
                      case "NCHAR":
                      case "CLOB":
                      case "VARCHAR":
                      case "NVARCHAR": schemaCDS += "String(" + elementP.LENGTH + ")"; break;
                      case "VARBINARY":
                      case "BINARY": schemaCDS += "Binary(" + elementP.LENGTH + ")"; break;
                      case "BLOB": schemaCDS += "LargeBinary"; break;
                      case "NCLOB": schemaCDS += "LargeString"; break;
                      default: schemaCDS += elementP.DATA_TYPE_NAME;
                    }
                    i++;
                  }
                });
                if (i) schemaCDS += ")";
              */
              schemaCDS += " {";
              i = 0;
              resColumns.forEach(elementC => {
                if (elementC.OBJECT_NAME === elementO.OBJECT_NAME) {
                  resConstraints.forEach(elementI => {
                    if (elementI.OBJECT_NAME === elementC.OBJECT_NAME && elementI.COLUMN_NAME === elementC.COLUMN_NAME && elementI.IS_PRIMARY_KEY === "TRUE") {
                      schemaCDS += " key";
                    }
                  });
                  // unclear how to determine key for views - assume first column
                  if (elementC.OBJECT_TYPE === "V" && i === 0) {
                    schemaCDS += " key";
                  }
                  i++;
                  schemaCDS += " " + (elementC.COLUMN_NAME).toLowerCase() + " : ";
                  switch (elementC.DATA_TYPE_NAME) {
                    case "BOOLEAN": schemaCDS += "Boolean"; break;
                    case "TINYINT":
                    case "SMALLINT":
                    case "INTEGER": schemaCDS += "Integer"; break;
                    case "BIGINT": schemaCDS += "Integer64"; break;
                    case "REAL":
                    case "DOUBLE": schemaCDS += "Double"; break;
                    case "SMALLDECIMAL":
                    case "DECIMAL": schemaCDS += "Decimal(" + elementC.LENGTH + "," + elementC.SCALE + ")"; break;
                    case "DATE": schemaCDS += "Date"; break;
                    case "TIME": schemaCDS += "Time"; break;
                    case "TIMESTAMP": schemaCDS += "Timestamp"; break;
                    case "CHAR":
                    case "NCHAR":
                    case "CLOB":
                    case "VARCHAR":
                    case "NVARCHAR": schemaCDS += "String(" + elementC.LENGTH + ")"; break;
                    case "VARBINARY":
                    case "BINARY": schemaCDS += "Binary(" + elementC.LENGTH + ")"; break;
                    case "BLOB": schemaCDS += "LargeBinary"; break;
                    case "NCLOB": schemaCDS += "LargeString"; break;
                    default: schemaCDS += elementC.DATA_TYPE_NAME;
                  }
                  if (elementC.IS_NULLABLE === "FALSE") {
                    schemaCDS += " not null";
                  }
                  if (elementC.DEFAULT_VALUE != null) {
                    schemaCDS += " default ";
                    switch (elementC.DATA_TYPE_NAME) {
                      case "BOOLEAN":
                      case "BIGINT":
                      case "DOUBLE":
                      case "DECIMAL":
                      case "SMALLINT":
                      case "TINYINT":
                      case "SMALLDECIMAL":
                      case "REAL":
                      case "INTEGER": schemaCDS += elementC.DEFAULT_VALUE; break;
                      default: schemaCDS += "'" + elementC.DEFAULT_VALUE + "'";
                    }

                  }
                  schemaCDS += ";";
                }
              });
              schemaCDS += "};";
            });
            schemaCDS += "}";
            // create catalog service
            let serviceCDS = "using {" + answers.get('projectName') + ".db." + answers.get('schemaName') + " as " + answers.get('schemaName') + "} from '../db/schema'; service CatalogService @(path : '/srv')";
            if (answers.get('auth')) {
              serviceCDS += " @(requires:'authenticated-user')";
            }
            serviceCDS += " {";
            resObjects.forEach(element => {
              serviceCDS += " entity " + element.OBJECT_NAME;
              if (answers.get('auth')) {
                serviceCDS += " @(restrict: [{ grant: ['READ','WRITE'], to: 'write' }, { grant: 'READ', to: 'read' }])";
              }
              if (element.OBJECT_TYPE === "V") {
                serviceCDS += " as select from " + answers.get('schemaName') + "." + element.OBJECT_NAME + " {*};";
              } else {
                serviceCDS += " as projection on " + answers.get('schemaName') + "." + element.OBJECT_NAME + ";";
              }
            });
            serviceCDS += "};";
            // scaffold project files
            fs.write(destinationRoot + "/db/src/" + answers.get('schemaName') + ".hdbsynonym", hdbSynonym);
            hdbViews.forEach(element => {
              fs.write(destinationRoot + "/db/src/" + answers.get('schemaName') + "-" + element.NAME + ".hdbview", element.VIEW);
            });
            fs.write(destinationRoot + "/db/schema.cds", schemaCDS);
            fs.write(destinationRoot + "/srv/cat-service.cds", serviceCDS);
            // create HANA technical user and roles
            sql = 'CREATE USER ' + prefix + '_GRANTOR PASSWORD ' + grantorPassword + ' NO FORCE_FIRST_PASSWORD_CHANGE';
            connection.exec(sql, function (err, result) {
              if (err) {
                return console.error(err);
              }
              sql = 'CREATE ROLE "' + prefix + '::EXTERNAL_ACCESS_G"';
              connection.exec(sql, function (err, result) {
                if (err) {
                  return console.error(err);
                }
                sql = 'CREATE ROLE "' + prefix + '::EXTERNAL_ACCESS"';
                connection.exec(sql, function (err, result) {
                  if (err) {
                    return console.error(err);
                  }
                  sql = 'GRANT "' + prefix + '::EXTERNAL_ACCESS_G", "' + prefix + '::EXTERNAL_ACCESS" TO ' + prefix + '_GRANTOR WITH ADMIN OPTION';
                  connection.exec(sql, function (err, result) {
                    if (err) {
                      return console.error(err);
                    }
                    sql = 'GRANT SELECT,INSERT,UPDATE,DELETE ON SCHEMA "' + answers.get('schemaName') + '" TO "' + prefix + '::EXTERNAL_ACCESS_G" WITH GRANT OPTION';
                    connection.exec(sql, function (err, result) {
                      if (err) {
                        return console.error(err);
                      }
                      sql = 'GRANT SELECT,INSERT,UPDATE,DELETE ON SCHEMA "' + answers.get('schemaName') + '" TO "' + prefix + '::EXTERNAL_ACCESS"';
                      connection.exec(sql, function (err, result) {
                        if (err) {
                          return console.error(err);
                        }
                        connection.disconnect(function (err) {
                          done(err);
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });

    // create the CF user defined service
    // we do this instead of adding to the mta.yaml to avoid the HANA technical user's password being visible in source files)
    let cupsParams = '{"user":"' + prefix + '_GRANTOR","password":"' + grantorPassword + '","schema":"' + answers.get('schemaName') + '","tags":["hana"]}';
    this.spawnCommandSync('cf', ['cups', answers.get('projectName') + '-db-' + answers.get('schemaName'), '-p', cupsParams]);

  }

  install() {
    // build and deploy if requested
    var answers = this.config;
    var mta = "mta_archives/" + answers.get("projectName") + "_0.0.1.mtar";
    if (answers.get("buildDeploy")) {
      let opt = { "cwd": this.destinationPath() };
      let resBuild = this.spawnCommandSync("mbt", ["build"], opt);
      if (resBuild.status === 0) {
        this.spawnCommandSync("cf", ["deploy", mta], opt);
      }
    } else {
      this.log("You need to build and deploy your project as follows:");
      this.log(" cd " + answers.get("projectName"));
      this.log(" mbt build");
      this.log(" cf deploy " + mta);
    }
  }

  end() {
    this.log("");
  }
};
