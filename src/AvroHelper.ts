import {
  AvroSchema,
  RawAvroSchema,
  AvroOptions,
  ConfluentSchema,
  SchemaHelper,
  ConfluentSubject,
} from './@types'
import { ConfluentSchemaRegistryArgumentError } from './errors'
import avro from 'avsc'

export default class AvroHelper implements SchemaHelper {
  private getRawAvroSchema(schema: ConfluentSchema): RawAvroSchema {
    return (typeof schema.schema === 'string'
      ? JSON.parse(schema.schema)
      : schema.schema) as RawAvroSchema
  }

  public getAvroSchema(schema: ConfluentSchema | RawAvroSchema, opts?: AvroOptions) {
    const rawSchema: RawAvroSchema = this.isRawAvroSchema(schema)
      ? schema
      : this.getRawAvroSchema(schema)

    // The `avro.Type.forSchema` will mutate the options object passed. This can cause issues if you calling `getAvroSchema`
    // for multiple schemas as stale state will bleed between the calls on the mutated options.
    // This is a work around for: https://github.com/mtth/avsc/issues/312
    const optionsCopy = { ...opts }

    // @ts-ignore TODO: Fix typings for Schema...
    const avroSchema: AvroSchema = avro.Type.forSchema(rawSchema, optionsCopy)
    return avroSchema
  }

  public validate(avroSchema: AvroSchema): void {
    if (!avroSchema.name) {
      throw new ConfluentSchemaRegistryArgumentError(`Invalid name: ${avroSchema.name}`)
    }
  }

  public getSubject(
    schema: ConfluentSchema,
    // @ts-ignore
    avroSchema: AvroSchema,
    separator: string,
  ): ConfluentSubject {
    const rawSchema: RawAvroSchema = this.getRawAvroSchema(schema)

    if (!rawSchema.namespace) {
      throw new ConfluentSchemaRegistryArgumentError(`Invalid namespace: ${rawSchema.namespace}`)
    }

    const subject: ConfluentSubject = {
      name: [rawSchema.namespace, rawSchema.name].join(separator),
    }
    return subject
  }

  private isRawAvroSchema(schema: ConfluentSchema | RawAvroSchema): schema is RawAvroSchema {
    const asRawAvroSchema = schema as RawAvroSchema
    return asRawAvroSchema.name != null && asRawAvroSchema.type != null
  }
}
