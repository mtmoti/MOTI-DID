import { Field, ErrorMessage } from "formik";
import { Text, Input, InputGroup, InputLeftAddon, InputRightAddon, Textarea } from "@chakra-ui/react";

const InputField = ({ field, label, placeholder, touched, errors }) => {
 
  return <Input
    {...field}
    label={label}
    placeholder={placeholder}
    errorBorderColor="red.400"
    backgroundColor="var(--koii-input-background-color)"
    color="var(--koii-create-topic)"
    isInvalid={touched[field.name] && errors[field.name]}
    border={"1px solid var(--koii-input-border-color)"}
  />
};

const StyledInput = ({ name, label, placeholder, as, isInvalid, leftAddon, rightAddon, ...rest }) => {
  return (
    <>
      <Field
        name={name}
        as={as}
        // isInvalid={!!isInvalid ?? null}
        style={{
          borderRadius: "12px",
          backgroundColor: "var(--koii-input-background-color)",
          fontFamily: "Poppins",
          width: "100%",
        }}
        {...rest}>
        {({ field, form: { touched, errors } }) => {
          return (
            <InputGroup>
              {leftAddon && (
                <InputLeftAddon
                  {...field}
                  name={name}
                  backgroundColor="white"
                  height="3rem"
                  border={errors[field.name] ? "2px solid #E53E3E" : "1px solid var(--koii-input-border-color)"}>
                  {leftAddon}
                </InputLeftAddon>
              )}
              {as.displayName !== "Textarea" ? (
                <InputField
                  field={field}
                  label={label}
                  placeholder={placeholder}
                  touched={touched}
                  errors={errors}
                  {...rest}
                />
              ) : (
                <Textarea
                  {...field}
                  label={label}
                  placeholder={placeholder}
                  errorBorderColor="red.400"
                  backgroundColor="var(--koii-input-background-color)"
                  color={"var(--koii-create-topic)"}
                  isInvalid={touched[field.name] && errors[field.name]}
                  border={"1px solid var(--koii-input-border-color)"}
                  {...rest}
                />
              )}
              {rightAddon && (
                <InputRightAddon
                  {...field}
                  name={name}
                  backgroundColor="white"
                  height="3rem"
                  border={errors[field.name] ? "2px solid #E53E3E" : "1px solid var(--koii-input-border-color)"}>
                  {rightAddon}
                </InputRightAddon>
              )}
            </InputGroup>
          );
        }}
      </Field>
      <Text mt={0.5} className="error">
        <ErrorMessage name={name} />
      </Text>
    </>
  );
};

export default StyledInput;
