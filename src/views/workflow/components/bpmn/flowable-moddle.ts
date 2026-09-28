/** Flowable 命名空间 moddle 描述符 */
export interface ModdleProperty {
  name: string;
  isAttr?: boolean;
  type?: string;
  isReference?: boolean;
}

interface ModdleType {
  name: string;
  isAbstract?: boolean;
  extends?: string[];
  properties?: ModdleProperty[];
}

interface ModdleDescriptor {
  name: string;
  uri: string;
  prefix: string;
  xml?: { tagAlias?: string };
  types: ModdleType[];
}

const flowableModdleDescriptor: ModdleDescriptor = {
  name: "Flowable",
  uri: "http://flowable.org/bpmn",
  prefix: "flowable",
  xml: {
    tagAlias: "lowerCase",
  },
  types: [
    {
      name: "FlowableAttributes",
      isAbstract: true,
      extends: ["bpmn:FlowNode"],
      properties: [
        { name: "formKey", isAttr: true, type: "String" },
        { name: "assignee", isAttr: true, type: "String" },
        { name: "candidateUsers", isAttr: true, type: "String" },
        { name: "candidateGroups", isAttr: true, type: "String" },
      ],
    },
  ],
};

export default flowableModdleDescriptor;
