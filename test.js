//@ts-check
"use strict";

const {
  object,
  string,
  number,
  minLength,
  nonEmpty,
  validate,
  optional,
nullable,
boolean,
date,
} = require("@typeofweb/schema");

const schema = object({
  name: minLength(4)(string()),
  email: string(),
  firstName: nonEmpty(string()),
  phone: nonEmpty(string()),
  age: number(),
});
const validator = validate(schema);

const results = [];

function test(i) {
  const obj = {
    name: "John Doe",
    email: "john.doe@company.space",
    firstName: "John",
    phone: "123-4567",
    age: i,
  };

  results[results.length-1] = validate(optional(string()))(String(i));
  results[results.length-1] = validate(nullable(string()))(null);
  results[results.length-1] = validate(optional(number()))(undefined);
  results[results.length-1] = validate(nullable(number()))(i);
  results[results.length-1] = validate(optional(boolean()))(true);
  results[results.length-1] = validate(nullable(boolean()))(false);

  return validator(obj);
}

for (let i = 0; i < 10000; ++i) {
  test(i);
}
