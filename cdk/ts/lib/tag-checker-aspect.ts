import { Annotations, IAspect, IConstruct, Stack } from "@aws-cdk/core";

export class TagChecker implements IAspect {

    constructor(private readonly requiredTags: string[]) {
    }
  
    public visit(node: IConstruct): void {
      if (!(node instanceof Stack)) return;
  
      this.requiredTags.forEach((tag) => {
        if (!Object.keys(node.tags.tagValues()).includes(tag)) {
          Annotations.of(node).addError(`Missing required tag "${tag}" on stack with id "${node.stackName}".`);
        }
      });
    }
  }
  