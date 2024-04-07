import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Input,
  // IconButton,
  Text,
  Textarea,
  Spacer,
  Spinner,
  // Stack,
  // Radio,
  // RadioGroup,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { Formik, ErrorMessage, Field, FieldArray } from "formik";
import { array, object, string, mixed, boolean } from "yup";
import { DeleteIcon } from "@chakra-ui/icons";
import "../../css/ButtonAnimations.css";
// import UploadSvg from "../icons/upload";
import { PersonalizeLinktree } from "./personalize-linktree";
import { PlusCircle, Copy } from "lucide-react";
import StyledInput from "../InputField";
import { buttonBgColors } from ".";
import { useSelector } from "react-redux";
import { useWalletContext } from "../../contexts";

const uploadIcon = {
  Dark: "/images/Theme2-upload-icon.png",
  Mint: "/images/Theme1-upload-icon.png",
  Gradient: "/images/Theme3-upload-icon.png",
  "Gradient-Two": "/images/Theme4-upload-icon.png",
};

function LinktreeEditForm({
  choosenLabelTheme,
  choosenTheme,
  linksGroup,
  handleSubmit,
  userData,
  isUploadingImage,
  isLoading,
  handleLabelSelection,
  handleThemeSelection,
  setImage,
  magicPayload,
  image,
  files,
  getInputProps,
  getRootProps,
  colorScheme,
  setImageChanged,
}) {
  // const thumbs = files.map((file) => (
  //   <div key={file.name}>
  //     <img
  //       className='user-image'
  //       alt='User'
  //       src={file.preview}
  //       onLoad={() => {
  //         URL.revokeObjectURL(file.preview);
  //       }}
  //     />
  //   </div>
  // ));

  const user = useSelector((state) => state.user?.user);

  const toast = useToast();

  const handleCopy = (text) => {
    navigator.clipboard.writeText(`https://moti.bio/${text}`);
    toast({
      title: "Link Copied",
      status: "success",
      duration: 1000,
      isClosable: true,
      position: "top",
    });
  };

  return (
    <Formik
      initialValues={{
        name: userData?.name,
        description: userData?.description,
        image: userData?.image,
        background: "",
        links: userData?.links,
        linktreeAddress: userData?.linktreeAddress,
      }}
      validationSchema={object({
        name: string().required("Name is required"),
        description: string()
          .min(5, "Bio is too short!")
          .max(140, "Bio should be less than 140 characters.")
          .required("A bio is required"),
        linktreeAddress: string()
          .min(5, "Address is too short!")
          .max(200, "Address is too Long")
          .required("An address is required.")
          .matches(
            /^[\w-]+$/,
            "Invalid characters. Only letters, numbers, underscores, and dashes are allowed."
          ),
        image: mixed().nullable().optional(),
        links: array(
          object({
            label: string().required("Link label is required"),
            redirectUrl: string()
              .required("Link URL is required")
              .matches(
                /^(https?:\/\/)/i,

                "Enter correct url!"
              ),
            key: string(),
            isFavorite: boolean(),
          })
        )
          .min(1, "At least one link is required!")
          .required("Add a social link"),
      })}
      onSubmit={handleSubmit}
    >
      {({ values, handleSubmit, isValid, errors, isSubmitting }) => (
        <form onSubmit={handleSubmit}>
          <Box width="100%">
            <Text
              fontSize="0.9rem"
              fontWeight="500"
              fontFamily="Poppins"
              color="var(--koii-create-topic)"
            >
              Choose Your Unique MOTI.BIO URL{" "}
              <span style={{ color: "#FD6E6B" }}>*</span>
            </Text>
            <Box my={2} width={{ base: "100%" }}>
              <Field
                name="linktreeAddress"
                border="1px solid var(--koii-input-border-color)"
              >
                {({ field, form: { setFieldValue } }) => (
                  <>
                    <InputGroup>
                      {/* <InputLeftAddon {...field} name="linktreeAddress" paddingRight="0 !important" borderRight="none !important" backgroundColor="var(--koii-input-background-color)" color="var(--koii-create-topic)" height="3rem" border={errors.linktreeAddress ? "2px solid #E53E3E" : "1px solid var(--koii-input-border-color)"} >moti.bio/</InputLeftAddon> */}
                      <Input
                        errorBorderColor="red.500"
                        // paddingLeft="0 !important"
                        disabled
                        value={`moti.bio/${values.linktreeAddress}`}
                        borderLeft="none !important"
                        _disabled={{ color: "var(--koii-create-topic)" }}
                        onChange={async (e) => {
                          // handleChangeUserName(e);
                          setFieldValue("linktreeAddress", e.target.value);
                        }}
                        // defaultValue={userData?.linktreeAddress}
                        // onKeyUp={handleChangeUserName}
                        isInvalid={errors && !!errors.linktreeAddress}
                        style={{
                          backgroundColor: "var(--koii-input-background-color)",
                          fontFamily: "Poppins",
                          paddingLeft: "0 !important",
                          color: "var(--koii-create-topic)",
                        }}
                        border="1px solid var(--koii-input-border-color)"
                        type="text"
                        placeholder="yourname"
                      />
                      {!errors.linktreeAddress && field.value && (
                        <InputRightElement
                          onClick={() => handleCopy(values.linktreeAddress)}
                          cursor="pointer"
                          ml="10px"
                          mt={1}
                        >
                          <Copy style={{ color: "var(--koii-create-topic)" }} />
                        </InputRightElement>
                        // <InputRightElement mt={1}>
                        //   <CheckCircle2 fill="#00BA00" color="white"  />
                        // </InputRightElement>
                      )}
                    </InputGroup>
                    <Text
                      fontFamily="Poppins"
                      mt={0}
                      fontWeight="500"
                      className="error"
                    >
                      <ErrorMessage name="linktreeAddress" />
                      {errors.linktreeAddress}
                    </Text>
                  </>
                )}
              </Field>
            </Box>
            <Text
              fontSize="0.8rem"
              fontWeight="500"
              mb={1}
              fontFamily="Poppins"
              color="#6B6B72"
            >
              This URL will be soulbound to your Decentralised Identity (DID).
              By claiming this URL, you will not be able to change it again.
              <br />
              <strong>
                For rewards, join our{" "}
                <a href="https://discord.gg/6bhbf7EkBZ" target="_blank">
                  Community Discord
                </a>{" "}
                and verify using your unique URL now!
              </strong>
            </Text>
          </Box>

          <Divider my={5} color="#C5C5C5" borderWidth="1px" />

          <Box
            mt={15}
            display="flex"
            width="100%"
            gap={{ base: "20px", md: "40px" }}
            flexDirection={{ base: "column", md: "row" }}
          >
            <Box
              maxWidth={{ base: "auto", md: "20%" }}
              display={"flex"}
              justifyContent={{ base: "center", md: "flex-start" }}
              width="100%"
            >
              {userData?.image || image ? (
                <div style={{ position: "relative" }}>
                  <img
                    defaultValue={userData?.image}
                    style={{
                      minWidth: "150px",
                      minHeight: "150px",
                      maxWidth: "150px",
                      maxHeight: "150px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                    src={image ? URL.createObjectURL(image) : userData?.image}
                  />
                  <Field name="image">
                    {({ form, field }) => {
                      const { setFieldValue } = form;
                      return (
                        <>
                          <input
                            type="file"
                            // required
                            hidden
                            name="image"
                            // defaultValue={userData?.image}
                            onChange={(e) => {
                              // setFiles(e.target.files);
                              // console.log(e.target.files)
                              setImageChanged(true);
                              setImage(e.target.files[0]);
                              // setImage(e.target.files[0].name);
                              setFieldValue("image", e.target.files[0].name);
                            }}
                            style={{
                              position: "absolute",
                              top: "100px",
                              left: "100px",
                              zIndex: "2",
                            }}
                            id="fileInput"
                          />
                          <label htmlFor="fileInput">
                            <img
                              style={{
                                zIndex: "1",
                                position: "absolute",
                                top: "100px",
                                left: "100px",
                                cursor: "pointer",
                              }}
                              src={uploadIcon[userData?.theme || choosenTheme]}
                            />
                          </label>
                        </>
                      );
                    }}
                  </Field>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  {/* <ProfileImageSvg /> */}
                  <img
                    style={{ zIndex: "0" }}
                    src="/images/DefaultUserProfile.png"
                  />
                  <Field name="image">
                    {({ form, field }) => {
                      const { setFieldValue } = form;
                      return (
                        <>
                          <input
                            type="file"
                            hidden
                            onChange={async (e) => {
                              // setFiles(e.target.files);
                              setImageChanged(true);
                              setImage(e.target.files[0]);
                              // setImageName(e.target.files[0].name);
                              setFieldValue("image", e.target.files[0].name);
                            }}
                            style={{
                              position: "absolute",
                              top: "105px",
                              left: "100px",
                              zIndex: "2",
                            }}
                            id="fileInput"
                          />
                          <label htmlFor="fileInput">
                            <img
                              style={{
                                zIndex: "1",
                                position: "absolute",
                                top: "105px",
                                left: "100px",
                                cursor: "pointer",
                              }}
                              src={uploadIcon[choosenTheme]}
                            />
                          </label>
                        </>
                      );
                    }}
                  </Field>
                </div>
              )}
            </Box>

            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              maxW={{ md: "80%" }}
              width="100%"
            >
              <Flex
                flexDirection={{ base: "column-reverse", md: "column" }}
                width="100%"
              >
                <Box mb={{ base: 3 }}>
                  <div
                    style={{
                      // display: "flex",
                      // alignItems: "center",
                      // gap: "20px",
                      width: "100%",
                    }}
                  >
                    <Text
                      fontSize="0.9rem"
                      fontWeight="500"
                      fontFamily="Poppins"
                      color="var(--koii-create-topic)"
                    >
                      Name <span style={{ color: "#FD6E6B" }}>*</span>
                    </Text>
                    <Box mt={1.5} mb={5} width={{ base: "100%" }}>
                      <StyledInput
                        name="name"
                        label="Full Name"
                        as={Input}
                        placeholder="Your name here"
                        isInvalid={errors.name}
                      />
                    </Box>
                    <Box>
                      <Text
                        fontSize="0.9rem"
                        fontWeight="500"
                        fontFamily="Poppins"
                        color="var(--koii-create-topic)"
                      >
                        Bio <span style={{ color: "#FD6E6B" }}>*</span>
                      </Text>
                      <StyledInput
                        name="description"
                        mt={1.5}
                        // height="200px"
                        placeholder="Brief description for your profile. URLs are hyperlinked."
                        label="Bio"
                        as={Textarea}
                        isInvalid={errors.description}
                      />
                    </Box>
                  </div>
                </Box>
              </Flex>
            </Box>
          </Box>

          <Box>
            <Text
              fontSize={{ base: "xl", md: "xl" }}
              fontWeight="700"
              my={5}
              fontFamily="Poppins"
              color="var(--koii-create-topic)"
            >
              Add Your Links
            </Text>

            <Text
              fontSize="1rem"
              fontWeight="700"
              fontFamily="Poppins"
              color="var(--koii-create-topic)"
            >
              Primary Link
            </Text>

            <Text
              fontSize="0.8rem"
              fontWeight="500"
              fontFamily="Poppins"
              color="#6B6B72"
            >
              Your primary link will stand out with a different color
            </Text>
          </Box>

          <FieldArray name="links">
            {({ push, remove }) => (
              <div>
                {values.links.map((_, index) => (
                  <Box key={index}>
                    <Box mt={6} width="100%">
                      <Flex
                        width="100%"
                        flexDirection={{ base: "column", md: "row" }}
                        key={index + 1}
                        mt={2}
                        gap="20px"
                        alignItems={{ base: "end", md: "center" }}
                      >
                        <Box w={{ base: "100%", md: "40%" }}>
                          <Box w="100%">
                            <Text color="var(--koii-create-topic)" width="100%">
                              {index === 0 ? "Primary" : ""} Link Label
                            </Text>
                            <Field
                              // color="var(--koii-create-text)"
                              background="var(--koii-input-background-color)"
                              placeholder="Eg: LinkedIn"
                              style={{
                                borderRadius: "12px",
                                color: "var(--koii-create-topic)",
                              }}
                              isInvalid={
                                errors.links && !!errors.links[index]?.label
                              }
                              name={`links.${index}.label`}
                              label="Link Name"
                              as={Input}
                              border="1px solid var(--koii-input-border-color)"
                            />
                          </Box>
                          <Box
                            display={{ base: "block", md: "none" }}
                            mt="0px"
                            w={{ base: "100%" }}
                          >
                            <Text className="error">
                              <ErrorMessage name={`links.${index}.label`} />
                            </Text>
                          </Box>
                        </Box>
                        <Spacer />
                        <Box
                          w={{ base: "100%", md: "58%" }}
                          mt={{ base: "0px", md: "0px" }}
                        >
                          <Box w={index === 0 ? "100%" : "95%"}>
                            <Text
                              color="var(--koii-create-topic)"
                              width={{ base: "150px", md: "auto" }}
                            >
                              {index === 0 ? "Primary" : ""} Link URL
                            </Text>
                            <Box display="flex" alignItems="center" gap="10px">
                              <Field
                                // color="var(--koii-create-text)"
                                background="var(--koii-input-background-color)"
                                placeholder="Eg: https://www.linkedin.com/in/name"
                                errorBorderColor="red.500"
                                style={{
                                  borderRadius: "12px",
                                  color: "var(--koii-create-topic)",
                                }}
                                isInvalid={
                                  errors.links &&
                                  !!errors.links[index]?.redirectUrl
                                }
                                name={`links.${index}.redirectUrl`}
                                label="Link URL"
                                as={Input}
                                border="1px solid var(--koii-input-border-color)"
                                width="100%"
                              />

                              {index !== 0 && (
                                <Box display={{ base: "flex", md: "none" }}>
                                  <DeleteIcon
                                    onClick={() => remove(index)}
                                    style={{
                                      color: "#A6A6A6",
                                      fontSize: "1.3rem",
                                      cursor: "pointer",
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>
                            <Box
                              display={{ base: "block", md: "none" }}
                              mt="0px"
                              w={{ base: "100%" }}
                            >
                              <Text className="error">
                                <ErrorMessage
                                  name={`links.${index}.redirectUrl`}
                                />
                              </Text>
                            </Box>
                          </Box>
                        </Box>
                        {index === 0 ? (
                          <div style={{ marginTop: "17px" }}> </div>
                        ) : (
                          <Box
                            display={{ base: "none", md: "flex" }}
                            style={{}}
                          >
                            <DeleteIcon
                              onClick={() => remove(index)}
                              style={{
                                color: "#A6A6A6",
                                fontSize: "1.3rem",
                                cursor: "pointer",
                              }}
                            />
                          </Box>
                        )}
                      </Flex>
                      <Flex
                        width="100%"
                        flexDirection={{ base: "column", md: "row" }}
                        key={index}
                        // mt="4px"
                        display={{ base: "none", md: "flex" }}
                        alignItems={{ base: "end", md: "center" }}
                      >
                        <Box mt="0px" w={{ base: "100%", md: "45%" }}>
                          <Text className="error">
                            <ErrorMessage name={`links.${index}.label`} />
                          </Text>
                        </Box>
                        <Spacer />
                        <Box mt="0px" w={{ base: "100%", md: "58%" }}>
                          <Text className="error">
                            <ErrorMessage name={`links.${index}.redirectUrl`} />
                          </Text>
                        </Box>
                      </Flex>
                      <Spacer />
                    </Box>
                    {index === 0 && <></>}
                    {values.links.length > 1 && index === 0 && (
                      <>
                        <Text
                          marginTop="10px"
                          fontSize="1rem"
                          fontWeight="700"
                          fontFamily="Poppins"
                          color="var(--koii-create-topic)"
                        >
                          Secondary Link
                        </Text>
                        <Text
                          fontSize="0.8rem"
                          fontWeight="500"
                          fontFamily="Poppins"
                          color="#6B6B72"
                        >
                          Additional links to include in your profile
                        </Text>
                      </>
                    )}
                  </Box>
                ))}
                <Box
                  display="flex"
                  alignItems="center"
                  gap="8px"
                  mt={5}
                  onClick={() => push(linksGroup)}
                  cursor="pointer"
                >
                  {/* <img src="/images/AddSecondaryLinkIcon.png" /> */}
                  <PlusCircle
                    fill="var(--koii-icon-fill-color)"
                    color="var(--koii-icon-color)"
                    style={{
                      borderColor: "var(--koii-icon-fill-color) !important",
                    }}
                    size="32px"
                  />
                  <Text
                    fontSize="0.9rem"
                    fontWeight="500"
                    fontFamily="Poppins"
                    color="var(--koii-create-topic)"
                  >
                    Add secondary link
                  </Text>
                </Box>
                {/* Other "Add Link" buttons go here */}
              </div>
            )}
          </FieldArray>

          <PersonalizeLinktree
            colorScheme={colorScheme}
            choosenTheme={choosenTheme}
            handleThemeSelection={handleThemeSelection}
            handleLabelSelection={handleLabelSelection}
            values={values}
            choosenLabelTheme={choosenLabelTheme}
          />
          <Flex w="100%" alignItems="center">
            <Button
              w="full"
              // maxW="254px"
              rounded="full"
              color={choosenTheme === "Gradient" ? "#040311" : "white"}
              background={buttonBgColors[choosenTheme]}
              // _disabled={{ background: buttonBgColors[choosenTheme], opacity: "30%" }}
              _hover={{
                background: buttonBgColors[choosenTheme],
                opacity: "0.9",
              }}
              height="4.125rem"
              mx="auto"
              mt={10}
              type="submit"
              isDisabled={!!magicPayload || isLoading || isUploadingImage}
              alignSelf="center"
            >
              <>
                {" "}
                {!!magicPayload || isLoading || isUploadingImage ? (
                  <Spinner />
                ) : (
                  "Publish"
                )}
              </>
            </Button>
          </Flex>
          <Box mt={7}>
            <Text
              textAlign="center"
              color="var(--koii-create-topic)"
              fontWeight="700"
            >
              {user?.email}
            </Text>
            <Text
              textAlign="center"
              color="var(--koii-create-topic)"
              fontWeight="400"
            >
              <strong>Wallet Address:</strong> {user?.publicKey}
            </Text>
          </Box>
        </form>
      )}
    </Formik>
  );
}

export default LinktreeEditForm;
