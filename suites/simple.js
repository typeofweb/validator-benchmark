//@ts-check
"use strict";

const Benchmarkify = require("benchmarkify");
const { shuffle } = require("lodash");
const pkg = require("../package.json");
const benchmark = new Benchmarkify("Validators benchmark").printHeader();

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
    const version = pkg.devDependencies["validator.js"];

    const constraints = {
      name: [is.notBlank(), is.ofLength({ min: 4, max: 25 })],
      email: is.email(),
      firstName: is.notBlank(),
      phone: is.notBlank(),
      age: [is.required(), is.greaterThan(18)],
    };

    bench.add(`validator.js@${version}`, () => {
      validator.validate(obj, constraints);
    });
  },
  // ---- validate.js ----
  function () {
    const validate = require("validate.js");
    const version = pkg.devDependencies["validate.js"];

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

    bench.add(`validate.js@${version}`, () => {
      return validate(obj, constraints);
    });
  },
  // ---- validatorjs ----
  function () {
    const Validator = require("validatorjs");
    const version = pkg.devDependencies["validatorjs"];

    const constraints = {
      name: "required|min:4|max:25",
      email: "required|email",
      firstName: "required",
      phone: "required",
      age: "required|integer|min:18",
    };

    bench.add(`validatorjs@${version}`, () => {
      let validation = new Validator(obj, constraints);
      return validation.passes();
    });
  },
  // ---- joi ----
  function () {
    const Joi = require("joi");
    const version = pkg.devDependencies["joi"];

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
  // ---- ajv ----
  // (function () {
  //   const Ajv = require("ajv").default;
  //   const version = pkg.devDependencies['ajv'];
  //   const ajv = new Ajv();

  //   const constraints = {
  //     properties: {
  //       name: { type: "string", minLength: 4, maxLength: 25 },
  //       email: { type: "string" },
  //       firstName: { type: "string" },
  //       phone: { type: "string" },
  //       age: { type: "integer", minimum: 18 },
  //     },
  //     required: ["name", "email", "firstName", "phone", "age"],
  //   };

  //   const validate = ajv.compile(constraints);

  //   bench.add(`ajv@${version}`, () => {
  //     return validate(obj);
  //   });
  // }),

  // ---- mschema ----
  function () {
    const mschema = require("mschema");
    const version = pkg.devDependencies["mschema"];

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

    bench.add(`mschema@${version}`, () => {
      return mschema.validate(obj, constraints);
    });
  },
  // ---- parambulator ----
  function () {
    const parambulator = require("parambulator");
    const version = pkg.devDependencies["parambulator"];

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

    bench.add(`parambulator@${version}`, () => {
      return check.validate(obj, (err) => {
        //console.log(err);
      });
    });
  },
  // ---- fastest-validator ----
  // (function () {
  //   const Validator = require("fastest-validator");
  //   const version = pkg.devDependencies['fastest-validator'];
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
  // }),

  // ---- yup ----
  function () {
    const yup = require("yup");
    const version = pkg.devDependencies["yup"];

    const schema = yup.object().shape({
      name: yup.string().min(4).max(25).required(),
      email: yup.string().email().required(),
      firstName: yup.mixed().required(),
      phone: yup.mixed().required(),
      age: yup.number().integer().min(18).required(),
    });

    bench.add(`yup@${version}`, () => {
      return schema.isValid(obj);
    });
  },
  // ---- validator.js ----
  function () {
    const {
      object,
      string,
      number,
      minLength,
      nonEmpty,
      validate,
    } = require("@typeofweb/schema");
    const version = pkg.devDependencies["@typeofweb/schema"];

    const schema = object({
      name: minLength(4)(string()),
      email: string(),
      firstName: nonEmpty(string()),
      phone: nonEmpty(string()),
      age: number(),
    });
    const validator = validate(schema);

    bench.add(`@typeofweb/schema@${version}`, () => {
      return validator(obj);
    });
  },
];

shuffle(cases).map((c) => c());

bench.run();
