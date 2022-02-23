import CountTransformer from "../index";
import {GraphQLTransform, validateModelSchema} from "@aws-amplify/graphql-transformer-core";
import * as fs from "fs";
import * as path from "path";
import {parse} from "graphql";
import {anything, countResources, expect as cdkExpect, haveResource} from '@aws-cdk/assert';
import {ModelTransformer} from "@aws-amplify/graphql-model-transformer";
import * as cdk from "@aws-cdk/core";
import Template from "@aws-amplify/graphql-transformer-core/lib/transformation/types";

const test_schema = fs.readFileSync(path.resolve(__dirname, "./test_schema.graphql"), {
    encoding: "utf-8"
});

const validSchema = `
type Foo @count @model {
    id: ID!
    string_field: String
    int_field: Int
    float_field: Float
    bool_field: Boolean
}
`

const makeTransformer = () => new GraphQLTransform({
    transformers: [
        new CountTransformer(),
        new ModelTransformer()
    ],
});

test("transformer fails when @model is not used", () => {
    const transformer = makeTransformer();
    expect(() => {
        transformer.transform(`
type Foo @count {
    id: ID!
    string_field: String
    int_field: Int
    float_field: Float
    bool_field: Boolean
}
        `);
    }).toThrow(/model/)
})

test("transformer succeeds when @model is used", () => {
    const transformer = makeTransformer();
    const out = transformer.transform(validSchema);
    const parsed = parse(out.schema)
    validateModelSchema(parsed);
})

test("resolvers generate successfully", () => {
    const transformer = makeTransformer();
    const out = transformer.transform(validSchema);
    const stack: Template = out.stacks.countResolverStack;

    cdkExpect(stack).to(countResources('AWS::Lambda::Function', 1));
    cdkExpect(stack).to(countResources('AWS::AppSync::DataSource', 1));
    cdkExpect(stack).to(countResources('AWS::AppSync::Resolver', 1));
});