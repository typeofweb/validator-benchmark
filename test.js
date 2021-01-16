//@ts-check
"use strict";

function test(i) {
  const obj = {
    name: "John Doe",
    email: "john.doe@company.space",
    firstName: "John",
    phone: "123-4567",
    age: i,
  };

  const {
    object,
    string,
    number,
    minLength,
    nonEmpty,
    validate,
  } = require("@typeofweb/schema");

  const schema = object({
    name: minLength(4)(string()),
    email: string(),
    firstName: nonEmpty(string()),
    phone: nonEmpty(string()),
    age: number(),
  });
  const validator = validate(schema);

  return validator(obj);
}

for (let i = 0; i < 1000; ++i) {
  test(i);
}
