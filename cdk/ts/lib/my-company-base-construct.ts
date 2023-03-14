import { Construct, Tags } from "@aws-cdk/core";
import { MetaData } from "./meta-data";
import { Capture, Match, Template } from "aws-cdk-lib/assertions";

export class MyCompanyMandatoryProps {
    public appCode:string;    
    public costCenter:string;
}

export class MyCompanyBaseConstruct extends Construct {
    constructor(scope: Construct, id: string, props: MyCompanyMandatoryProps) {
      super(scope, id);
      if(props.appCode==null) throw("Specifying the appCode is mandatory in this company!");      
      if(props.costCenter==null) throw("Specifying the costCenter is mandatory in this company!");
  
      Tags.of(this).add(MetaData.COST_CENTER, props.costCenter);      
      Tags.of(this).add(MetaData.APP_CODE, props.appCode);      
    }
}