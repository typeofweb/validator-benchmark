//@ts-check
"use strict";

const Benchmarkify = require("benchmarkify");
const jsonschema = require("jsonschema");
const superstruct = require("superstruct");
const { shuffle } = require("lodash");
const pkg = require("../package.json");
const benchmark = new Benchmarkify("Validators benchmark").printHeader();
const TsJsonValidator = require("ts-json-validator");
const Zod = require("zod");
const IoTs = require("io-ts");
const { either } = require("fp-ts/lib/Either");

let bench = benchmark.createSuite("Simple object");

const obj = {
  name: "John Doe",
  email: "john.doe@company.space",
  firstName: "John",
  phone: "123-4567",
  age: 33,
};

const cases = [
  // ---- validator.js ----
  function () {
    const is = require("validator.js").Assert;
    const validator = require("validator.js").validator();
    const version = pkg.dependencies["validator.js"];

    const constraints = {
      name: [is.notBlank(), is.ofLength({ min: 4, max: 25 })],
      email: is.email(),
      firstName: is.notBlank(),
      phone: is.notBlank(),
      age: [is.required(), is.greaterThan(18)],
    };

    // bench.add(`validator.js@${version}`, () => {
    //   validator.validate(obj, constraints);
    // });
  },
  // ---- validate.js ----
  function () {
    const validate = require("validate.js");
    const version = pkg.dependencies["validate.js"];

    const constraints = {
      name: {
        presence: true,
        length: {
          minimum: 4,
          maximum: 25,
        },
      },
      email: { email: true },
      firstName: { presence: true },
      phone: { presence: true },
      age: {
        numericality: {
          onlyInteger: true,
          greaterThan: 18,
        },
      },
    };

    // bench.add(`validate.js@${version}`, () => {
    //   return validate(obj, constraints);
    // });
  },
  // ---- validatorjs ----
  function () {
    const Validator = require("validatorjs");
    const version = pkg.dependencies["validatorjs"];

    const constraints = {
      name: "required|min:4|max:25",
      email: "required|email",
      firstName: "required",
      phone: "required",
      age: "required|integer|min:18",
    };

    // bench.add(`validatorjs@${version}`, () => {
    //   let validation = new Validator(obj, constraints);
    //   return validation.check();
    // });
  },
  // ---- joi ----
  function () {
    const Joi = require("joi");
    const version = pkg.dependencies["joi"];

    const schema = Joi.object().keys({
      name: Joi.string().min(4).max(25).required(),
      email: Joi.string().email().required(),
      firstName: Joi.required(),
      phone: Joi.required(),
      age: Joi.number().integer().min(18).required(),
    });

    bench.add(`joi@${version}`, () => {
      return schema.validate(obj);
    });
  },

  // ---- mschema ----
  function () {
    const mschema = require("mschema");
    const version = pkg.dependencies["mschema"];

    const constraints = {
      name: {
        type: "string",
        minLength: 4,
        maxLength: 25,
      },
      email: "string",
      firstName: "string",
      phone: "string",
      age: {
        type: "number",
        min: 18,
      },
    };

    // bench.add(`mschema@${version}`, () => {
    //   return mschema.validate(obj, constraints);
    // });
  },
  // ---- parambulator ----
  function () {
    const parambulator = require("parambulator");
    const version = pkg.dependencies["parambulator"];

    const constraints = {
      name: {
        type$: "string",
        required$: true,
        minlen$: 4,
        maxlen$: 25,
      },
      email: { type$: "string", required$: true },
      firstName: { type$: "string", required$: true },
      phone: { type$: "string", required$: true },
      age: {
        type$: "number",
        required$: true,
        min$: 18,
      },
    };

    let check = parambulator(constraints);

    // bench.add(`parambulator@${version}`, () => {
    //   return check.validate(obj, (err) => {
    //     // console.log(err);
    //   });
    // });
  },
  // function () {
  //   const Validator = require("fastest-validator");
  //   const version = pkg.dependencies['fastest-validator'];
  //   const v = new Validator();

  //   const constraints = {
  //     name: {
  //       type: "string",
  //       min: 4,
  //       max: 25,
  //     },
  //     email: { type: "email" },
  //     firstName: { type: "string" },
  //     phone: { type: "string" },
  //     age: {
  //       type: "number",
  //       min: 18,
  //     },
  //   };

  //   let check = v.compile(constraints);

  //   let testObj = obj;

  //   bench.add(`fastest-validator@${version}`, () => {
  //     let res = check(testObj);
  //     if (res !== true) throw new Error("Validation error!", res);
  //   });
  // },

  // ---- yup ----
  function () {
    const yup = require("yup");
    const version = pkg.dependencies["yup"];

    const schema = yup.object().shape({
      name: yup.string().min(4).max(25).required(),
      email: yup.string().email().required(),
      firstName: yup.mixed().required(),
      phone: yup.mixed().required(),
      age: yup.number().integer().min(18).required(),
    });

    bench.add(`yup@${version}`, () => {
      return schema.validateSync(obj);
    });
  },
  // ---- @typeofweb/schema ----
  function () {
    const {
      object,
      string,
      number,
      minLength,
      nonEmpty,
      validate,
    } = require("@typeofweb/schema");
    const version = pkg.dependencies["@typeofweb/schema"];

    const schema = object({
      name: string(),
      email: string(),
      firstName: string(),
      phone: string(),
      age: number(),
    });
    const validator = validate(schema);

    bench.ref(`@typeofweb/schema@ALPHA`, () => {
      return validator(obj);
    });
  },
  function () {
    const {
      object,
      string,
      number,
      minLength,
      nonEmpty,
      validate,
    } = require("@typeofweb/schema_main");
    const version = pkg.dependencies["@typeofweb/schema_main"];

    const schema = object({
      name: string(),
      email: string(),
      firstName: string(),
      phone: string(),
      age: number(),
    });
    const validator = validate(schema);

    bench.add(`@typeofweb/schema@0.5.0`, () => {
      return validator(obj);
    });
  },
  // ---- jsonschema ----
  function () {
    const jsonschema = require("jsonschema");
    const version = pkg.dependencies["jsonschema"];

    const v = new jsonschema.Validator();

    var constraints = {
      id: "/SimpleAddress",
      type: "object",
      properties: {
        name: { type: "string", minLength: 4, maxLength: 25 },
        email: { type: "string", format: "email" },
        firstName: { type: "string", minLength: 1 },
        phone: { type: "string" },
        age: { type: "integer", minimum: 18 },
      },
      required: ["name", "firstName", "age"],
    };

    // bench.add(`jsonschema@${version}`, () => {
    //   v.validate(obj, constraints);
    // });
  },
  // ---- superstruct ----
  function () {
    const superstruct = require("superstruct");
    const version = pkg.dependencies["superstruct"];

    const validator = superstruct.object({
      name: superstruct.size(superstruct.string(), 4, 25),
      email: superstruct.string(),
      firstName: superstruct.size(superstruct.string(), 1),
      phone: superstruct.size(superstruct.string(), 1),
      age: superstruct.size(superstruct.integer(), 18),
    });

    bench.add(`superstruct@${version}`, () => {
      validator.validate(obj);
    });
  },

  function zodSuite() {
    const version = pkg.dependencies["zod"];

    const schema = Zod.object({
      name: Zod.string().min(4).max(25),
      email: Zod.string().nonempty().email(),
      firstName: Zod.any(),
      phone: Zod.any(),
      age: Zod.number().int().min(18),
    });

    bench.add(`zod@${version}`, () => {
      return schema.parse(obj);
    });
  },

  function ioTsSuite() {
    const version = pkg.dependencies["io-ts"];

    const NameCodec = new IoTs.Type(
      "Name",
      IoTs.string.is,
      (u, c) =>
        either.chain(IoTs.string.validate(u, c), (u) =>
          u.length >= 4 && u.length <= 25 ? IoTs.success(u) : IoTs.failure(u, c)
        ),
      (u) => u
    );

    const EmailCodec = new IoTs.Type(
      "Email",
      IoTs.string.is,
      (u, c) =>
        either.chain(IoTs.string.validate(u, c), (u) =>
          u.length > 0 ? IoTs.success(u) : IoTs.failure(u, c)
        ),
      (u) => u
    );

    const AgeCodec = new IoTs.Type(
      "Age",
      IoTs.number.is,
      (u, c) =>
        either.chain(IoTs.number.validate(u, c), (u) =>
          u >= 18 && Number.isInteger(u) ? IoTs.success(u) : IoTs.failure(u, c)
        ),
      (u) => u
    );

    const schema = IoTs.type({
      name: NameCodec,
      email: EmailCodec,
      firstName: IoTs.unknown,
      phone: IoTs.unknown,
      age: AgeCodec,
    });

    bench.add(`io-ts@${version}`, () => {
      return schema.decode(obj);
    });
  },
];

shuffle(cases).map((c) => c());

bench.run();
