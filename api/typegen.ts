import { FileUpload } from "./types"

import type { Context } from "./types"
import type { core } from "nexus"
declare global {
  interface NexusGenCustomInputMethods<TypeName extends string> {
    /**
     * The `Upload` scalar type represents a file upload.
     */
    upload<FieldName extends string>(fieldName: FieldName, opts?: core.CommonInputFieldConfig<TypeName, FieldName>): void // "Upload";
    /**
     * A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    date<FieldName extends string>(fieldName: FieldName, opts?: core.CommonInputFieldConfig<TypeName, FieldName>): void // "DateTime";
    /**
     * string과 똑같습니다(S3상 파일 URI 표기용 스칼라).
     */
    fileUri<FieldName extends string>(fieldName: FieldName, opts?: core.CommonInputFieldConfig<TypeName, FieldName>): void // "FileUri";
  }
}
declare global {
  interface NexusGenCustomOutputMethods<TypeName extends string> {
    /**
     * The `Upload` scalar type represents a file upload.
     */
    upload<FieldName extends string>(fieldName: FieldName, ...opts: core.ScalarOutSpread<TypeName, FieldName>): void // "Upload";
    /**
     * A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    date<FieldName extends string>(fieldName: FieldName, ...opts: core.ScalarOutSpread<TypeName, FieldName>): void // "DateTime";
    /**
     * string과 똑같습니다(S3상 파일 URI 표기용 스칼라).
     */
    fileUri<FieldName extends string>(fieldName: FieldName, ...opts: core.ScalarOutSpread<TypeName, FieldName>): void // "FileUri";
  }
}
declare global {
  interface NexusGenCustomOutputProperties<TypeName extends string> {
    crud: NexusPrisma<TypeName, 'crud'>
    model: NexusPrisma<TypeName, 'model'>
  }
}

declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
  FileUpdateInput: { // input type
    existingFile?: NexusGenScalars['FileUri'] | null; // FileUri
    newFile?: NexusGenScalars['Upload'] | null; // Upload
  }
  SiteInformationTitleContentDataInput: { // input type
    content: string; // String!
    title: string; // String!
  }
}

export interface NexusGenEnums {
}

export interface NexusGenScalars {
  String: string
  Int: number
  Float: number
  Boolean: boolean
  ID: string
  DateTime: Date
  FileUri: string
  Upload: FileUpload
}

export interface NexusGenObjects {
  Image: { // root type
    original: NexusGenScalars['FileUri']; // FileUri!
  }
  Mutation: {};
  Query: {};
  SignInType: { // root type
    accessToken: string; // String!
    refreshToken: string; // String!
  }
  SiteInformation: {};
  SiteInformationTitleContentData: { // root type
    content: string; // String!
    title: string; // String!
  }
  Subscription: {};
}

export interface NexusGenInterfaces {
}

export interface NexusGenUnions {
}

export type NexusGenRootTypes = NexusGenObjects

export type NexusGenAllTypes = NexusGenRootTypes & NexusGenScalars

export interface NexusGenFieldTypes {
  Image: { // field return type
    large: NexusGenScalars['FileUri']; // FileUri!
    medium: NexusGenScalars['FileUri']; // FileUri!
    original: NexusGenScalars['FileUri']; // FileUri!
    small: NexusGenScalars['FileUri']; // FileUri!
  }
  Mutation: { // field return type
    renewToken: NexusGenRootTypes['SignInType'] | null; // SignInType
    requestPhoneVerificationByEveryone: boolean; // Boolean!
    testMutation: boolean | null; // Boolean
    updateSiteInformationByAdmin: boolean; // Boolean!
    verifyPhoneByEveryone: number; // Int!
  }
  Query: { // field return type
    selectSiteInformationByEveryone: NexusGenRootTypes['SiteInformation']; // SiteInformation!
    testQuery: boolean | null; // Boolean
    whoami: string | null; // String
  }
  SignInType: { // field return type
    accessToken: string; // String!
    refreshToken: string; // String!
  }
  SiteInformation: { // field return type
    file: NexusGenScalars['FileUri'] | null; // FileUri
    files: Array<NexusGenScalars['FileUri'] | null> | null; // [FileUri]
    titleContentInfo: NexusGenRootTypes['SiteInformationTitleContentData'][] | null; // [SiteInformationTitleContentData!]
    url: string | null; // String
  }
  SiteInformationTitleContentData: { // field return type
    content: string; // String!
    title: string; // String!
  }
  Subscription: { // field return type
    subscribeTest: boolean | null; // Boolean
  }
}

export interface NexusGenFieldTypeNames {
  Image: { // field return type name
    large: 'FileUri'
    medium: 'FileUri'
    original: 'FileUri'
    small: 'FileUri'
  }
  Mutation: { // field return type name
    renewToken: 'SignInType'
    requestPhoneVerificationByEveryone: 'Boolean'
    testMutation: 'Boolean'
    updateSiteInformationByAdmin: 'Boolean'
    verifyPhoneByEveryone: 'Int'
  }
  Query: { // field return type name
    selectSiteInformationByEveryone: 'SiteInformation'
    testQuery: 'Boolean'
    whoami: 'String'
  }
  SignInType: { // field return type name
    accessToken: 'String'
    refreshToken: 'String'
  }
  SiteInformation: { // field return type name
    file: 'FileUri'
    files: 'FileUri'
    titleContentInfo: 'SiteInformationTitleContentData'
    url: 'String'
  }
  SiteInformationTitleContentData: { // field return type name
    content: 'String'
    title: 'String'
  }
  Subscription: { // field return type name
    subscribeTest: 'Boolean'
  }
}

export interface NexusGenArgTypes {
  Mutation: {
    renewToken: { // args
      accessToken: string; // String!
      refreshToken: string; // String!
    }
    requestPhoneVerificationByEveryone: { // args
      phoneNumber: string; // String!
    }
    updateSiteInformationByAdmin: { // args
      content?: string | null; // String
      files?: NexusGenInputs['FileUpdateInput'][] | null; // [FileUpdateInput!]
      siteInformationId: string; // String!
      titleContentData?: NexusGenInputs['SiteInformationTitleContentDataInput'][] | null; // [SiteInformationTitleContentDataInput!]
    }
    verifyPhoneByEveryone: { // args
      phoneNumber: string; // String!
      verificationNumber: string; // String!
    }
  }
  Query: {
    selectSiteInformationByEveryone: { // args
      id: string; // String!
    }
  }
}

export interface NexusGenAbstractTypeMembers {
}

export interface NexusGenTypeInterfaces {
}

export type NexusGenObjectNames = keyof NexusGenObjects;

export type NexusGenInputNames = keyof NexusGenInputs;

export type NexusGenEnumNames = never;

export type NexusGenInterfaceNames = never;

export type NexusGenScalarNames = keyof NexusGenScalars;

export type NexusGenUnionNames = never;

export type NexusGenObjectsUsingAbstractStrategyIsTypeOf = never;

export type NexusGenAbstractsUsingStrategyResolveType = never;

export type NexusGenFeaturesConfig = {
  abstractTypeStrategies: {
    isTypeOf: false
    resolveType: true
    __typename: false
  }
}

export interface NexusGenTypes {
  context: Context;
  inputTypes: NexusGenInputs;
  rootTypes: NexusGenRootTypes;
  inputTypeShapes: NexusGenInputs & NexusGenEnums & NexusGenScalars;
  argTypes: NexusGenArgTypes;
  fieldTypes: NexusGenFieldTypes;
  fieldTypeNames: NexusGenFieldTypeNames;
  allTypes: NexusGenAllTypes;
  typeInterfaces: NexusGenTypeInterfaces;
  objectNames: NexusGenObjectNames;
  inputNames: NexusGenInputNames;
  enumNames: NexusGenEnumNames;
  interfaceNames: NexusGenInterfaceNames;
  scalarNames: NexusGenScalarNames;
  unionNames: NexusGenUnionNames;
  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];
  allOutputTypes: NexusGenTypes['objectNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['unionNames'] | NexusGenTypes['interfaceNames'] | NexusGenTypes['scalarNames'];
  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes']
  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];
  abstractTypeMembers: NexusGenAbstractTypeMembers;
  objectsUsingAbstractStrategyIsTypeOf: NexusGenObjectsUsingAbstractStrategyIsTypeOf;
  abstractsUsingStrategyResolveType: NexusGenAbstractsUsingStrategyResolveType;
  features: NexusGenFeaturesConfig;
}


declare global {
  interface NexusGenPluginTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginInputTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginInputFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginSchemaConfig {
  }
  interface NexusGenPluginArgConfig {
  }
}