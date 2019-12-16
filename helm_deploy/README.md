
### Example test deploy command

```
helm --namespace dps-toolkit upgrade health-kick ./health-kick/ --install --values=values-prod.yaml --dry-run --debug
```

Test template output:

```
helm template ./licences/ --values=values-prod.yaml
```

### Rolling back a release
Find the revision number for the deployment you want to roll back:
```
helm --namespace dps-toolkit history health-kick
```
(note, each revision has a appVersion which has the app version used by circleci)

Rollback
```
helm --namespace dps-toolkit rollback health-kick [INSERT REVISION NUMBER HERE] --wait
```

### Setup Lets Encrypt cert

Ensure the certificate definition exists in the cloud-platform-environments repo under the relevant namespaces folder

e.g.
```
cloud-platform-environments/namespaces/live-1.cloud-platform.service.justice.gov.uk/[INSERT NAMESPACE NAME]/05-certificate.yaml
```
