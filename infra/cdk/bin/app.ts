import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { CphStack } from "../lib/cph-stack";

const app = new App();
new CphStack(app, "CphStack", {
  env: { region: "ap-southeast-1" }
});
