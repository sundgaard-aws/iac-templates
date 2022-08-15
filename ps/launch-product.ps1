#--product-id is the ID of the product
#--provisioning-artifact-id this is the ID of the version
#--provisioned-product-name this is the name that the provsioned product will have during/after launch
aws servicecatalog provision-product --product-id prod-ro5mhtezatrfm --provisioning-artifact-id pa-mmppqcelrxaeq --provisioned-product-name "StandardObjectBucket-02151515" --provisioning-parameters Key=BucketName,Value=sundgaar02




Key=AccountEmail,Value=aa@aa.com
Account email, must be unique for each AWS Account.
Key=AccountName,Value=Sandbox02
Account name, the new managed Account will be created with this name.
Key=ManagedOrganizationalUnit,Value=Custom
Managed organizational unit. The managed Account will be placed under this Organizational Unit.
Key=SSOUserEmail,Value=user01@aa.com
SSO user email. A new SSO user will be created for this email, if it does not exist. This SSO user will be associated with the new managed Account.
Key=SSOUserFirstName,Value=User
SSO user first name.
Key=SSOUserLastName,Value=01

aws servicecatalog provision-product --product-id prod-rdasdrrrrfm --provisioning-artifact-id pa-dwadccgreq --provisioned-product-name "SandboxAccount02-02111414" --provisioning-parameters Key=AccountEmail,Value=aa@aa.com,Key=AccountName,Value=Sandbox02,Key=ManagedOrganizationalUnit,Value=Custom,Key=SSOUserEmail,Value=user01@aa.com,Key=SSOUserFirstName,Value=User,Key=SSOUserLastName,Value=01
