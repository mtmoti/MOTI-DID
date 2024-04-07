import React from "react";
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
  Divider,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
} from "@chakra-ui/react";
import { Formik, ErrorMessage, Field, FieldArray } from "formik";
import { array, object, string, mixed, boolean } from "yup";
import { DeleteIcon } from "@chakra-ui/icons";
import "../../css/ButtonAnimations.css";
import { PreviewImage } from "./preview-image";
// import UploadSvg from "../icons/upload";
// import ProfileImageSvg from "../icons/profile-image";
import { PersonalizeLinktree } from "./personalize-linktree";
import { useWalletContext } from "../../contexts";
import StyledInput from "../InputField";
import { CheckCircle2, PlusCircle } from "lucide-react";
import { useSelector } from "react-redux";

export const buttonBgColors = {
  Dark: "linear-gradient(92.39deg, #0E9BF4 23.13%, #2BD4BE 110.39%)",
  Mint: "#100E1E",
  Gradient: "linear-gradient(94.11deg, #F9A443 3.58%, #EA8224 98.65%)",
  "Gradient-Two": "#734C3D",
};

const uploadIcon = {
  Dark: "/images/Theme2-upload-icon.png",
  Mint: "/images/Theme1-upload-icon.png",
  Gradient: "/images/Theme3-upload-icon.png",
  "Gradient-Two": "/images/Theme4-upload-icon.png",
};

function LinktreeForm({
  choosenLabelTheme,
  choosenTheme,
  linksGroup,
  image,
  handleSubmit,
  setFiles,
  setImage,
  setImageName,
  handleChangeUserName,
  usernameError,
  disabled,
  isLoading,
  isUploadingImage,
  handleLabelSelection,
  handleThemeSelection,
  colorScheme,
  registerLinkText,
  isValidUrl,
}) {
  const { magicPayload } = useWalletContext();

  const user = useSelector((state) => state.user?.user);

  return (
    <Formik
      initialValues={{
        name: "",
        description: "",
        image: null,
        background: "",
        links: [linksGroup],
        linktreeAddress: "",
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
            redirectUrl: string().required("Link URL is required").matches(
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
      {({
        values,
        handleSubmit,
        isValid,
        errors,
        setFieldValue,
        touched,
        setFieldError,
        isSubmitting,
      }) => {
        return (
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
                        <InputLeftAddon
                          {...field}
                          name="linktreeAddress"
                          backgroundColor="var(--koii-input-background-color)"
                          color="var(--koii-create-topic)"
                          height="3rem"
                          border={
                            errors.linktreeAddress
                              ? "2px solid #E53E3E"
                              : "1px solid var(--koii-input-border-color)"
                          }
                        >
                          moti.bio/
                        </InputLeftAddon>
                        <Input
                          errorBorderColor="red.500"
                          onChange={async (e) => {
                            // handleChangeUserName(e);
                            setFieldValue("linktreeAddress", e.target.value);
                          }}
                          onKeyUp={handleChangeUserName}
                          isInvalid={errors && !!errors.linktreeAddress}
                          style={{
                            backgroundColor:
                              "var(--koii-input-background-color)",
                            fontFamily: "Poppins",
                            paddingLeft: "0 !important",
                            color: "var(--koii-create-topic)",
                          }}
                          border="1px solid var(--koii-input-border-color)"
                          type="text"
                          placeholder="yourname"
                        />
                        {!errors.linktreeAddress &&
                          field.value &&
                          isValidUrl &&
                          !usernameError && (
                            <InputRightElement mt={1}>
                              <CheckCircle2 fill="#00BA00" color="white" />
                            </InputRightElement>
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
                      {!!usernameError && (
                        <Text
                          fontFamily="Poppins"
                          mt={0}
                          fontWeight="500"
                          className="error"
                        >
                          {usernameError}
                        </Text>
                      )}
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
              </Text>
            </Box>

            <Divider my={5} color="#C5C5C5" borderWidth="1px" />

            <Box width="100%">
              <Text
                fontSize={{ base: "xl", md: "xl" }}
                fontWeight="700"
                my={5}
                fontFamily="Poppins"
                color="var(--koii-create-topic)"
              >
                Basic Info
              </Text>

              <Box
                mt={15}
                display="flex"
                width="100%"
                gap={{ base: "20px", md: "40px" }}
                flexDirection={{ base: "column", md: "row" }}
              >
                <Box
                  maxWidth={{ base: "auto", md: "20%" }}
                  display="flex"
                  justifyContent={{ base: "center", md: "start" }}
                  width="100%"
                >
                  {image ? (
                    <div style={{ position: "relative" }}>
                      <PreviewImage width={100} height={100} file={image} />
                      <Field name="image">
                        {({ form, field }) => {
                          const { setFieldValue } = form;
                          return (
                            <>
                              <input
                                type="file"
                                hidden
                                onChange={async (e) => {
                                  setFiles(e.target.files);
                                  setImage(e.target.files[0]);
                                  setImageName(e.target.files[0].name);
                                  setFieldValue(
                                    "image",
                                    e.target.files[0].name
                                  );
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
                                  alt="user upload icon"
                                  style={{
                                    zIndex: "1",
                                    position: "absolute",
                                    top: "100px",
                                    left: "100px",
                                    cursor: "pointer",
                                  }}
                                  src={uploadIcon[choosenTheme]}
                                />
                              </label>
                            </>
                            // <UploadSvg />
                            // Upload Photo
                          );
                        }}
                      </Field>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      {/* <ProfileImageSvg /> */}
                      <img
                        alt="default user"
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
                                  setFiles(e.target.files);
                                  setImage(e.target.files[0]);
                                  setImageName(e.target.files[0].name);
                                  setFieldValue(
                                    "image",
                                    e.target.files[0].name
                                  );
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
                                  alt="user upload icon"
                                  style={{
                                    zIndex: "1",
                                    position: "absolute",
                                    top: "100px",
                                    left: "100px",
                                    cursor: "pointer",
                                  }}
                                  src={uploadIcon[choosenTheme]}
                                />
                              </label>
                            </>
                            // <UploadSvg />
                            // Upload Photo
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
                          {/* <Field
                          name="name"
                          label="Full Name"
                          isInvalid={errors.name}
                          // color="var(--koii-blue)"
                          as={Input}
                          placeholder="Your name here"
                          // className="input-border"
                          style={{
                            borderRadius: "12px",
                            backgroundColor: "white",
                            fontFamily: "Poppins",
                          }}
                          border={"1px solid #D5D5D5"}
                        />
                        <Text mt={0.5} className="error">
                          <ErrorMessage name="name" />
                        </Text> */}
                          <StyledInput
                            name="name"
                            label="Full Name"
                            as={Input}
                            placeholder="Your name here"
                            isInvalid={errors.name}
                            // errorMessage={errors.name}
                          />
                        </Box>
                        <Box
                        // display="flex"
                        // gap="12px"
                        // justifyContent="flex-start"
                        // alignItems="flex-start"
                        >
                          <Text
                            fontSize="0.9rem"
                            fontWeight="500"
                            fontFamily="Poppins"
                            color="var(--koii-create-topic)"
                          >
                            Bio <span style={{ color: "#FD6E6B" }}>*</span>
                          </Text>
                          {/* <Field
                          mt={1.5}
                          borderRadius="12px"
                          name="description"
                          placeholder="Brief description for your profile. URLs are hyperlinked."
                          label="Bio"
                          background="white"
                          // color="var(--koii-create-text)"
                          as={Textarea}
                          // height="150px"
                          // className="input-border"
                          border="1px solid #D5D5D5"
                        /> */}
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
                        {/* <Text className="error">
                        <ErrorMessage name="description" />
                      </Text> */}
                      </div>
                    </Box>

                    {/* <Box mb={{ base: 3, md: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        width: "100%",
                      }}>
                      <Text wordBreak="keep-all" color="var(--koii-create-text)">
                        Profile Photo
                      </Text>
                      <Field name="image">
                        {({ form, field }) => {
                          const { setFieldValue } = form;
                          return (
                            <label class="custom-file-upload">
                              <input
                                type="file"
                                required
                                onChange={async (e) => {
                                  setFiles(e.target.files);
                                  setImage(e.target.files[0]);
                                  setImageName(e.target.files[0].name);
                                  setFieldValue("image", e.target.files[0].name);
                                }}
                                style={{
                                  display: "none",
                                }}
                              />
                              <UploadSvg />
                              Upload Photo
                            </label>
                          );
                        }}
                      </Field>
                    </div>
                    <Text className="error">
                      <ErrorMessage name="image" />
                    </Text>
                  </Box> */}
                  </Flex>
                </Box>
              </Box>

              <Divider my={5} color="#C5C5C5" borderWidth="1px" />

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

              {/* <Text fontSize="m" mt={10} mr={2} color="var(--koii-create-topic)">
              Primary Link Label
            </Text>
            <Flex alignItems={"center"}>
              <Text mr={3} color="var(--koii-create-text)">
                linktree.koii.network/
              </Text>
              <Field name="linktreeAddress">
                {({ form, field }) => {
                  const { setFieldValue } = form;
                  return (
                    <input
                      style={{
                        color: "black",
                        background: "white",
                        borderRadius: "20px",
                      }}
                      type="text"
                      className="input-border input-container"
                      required
                      name="linktreeAddress"
                      borderWidth="1.5px"
                      onChange={async (e) => {
                        // handleChangeUserName(e);
                        setFieldValue("linktreeAddress", e.target.value);
                      }}
                      onKeyUp={handleChangeUserName}
                    />
                  );
                }}
              </Field>
            </Flex>
            <Box mt={5}>
              <Text className="error">
                <ErrorMessage name="linktreeAddress" />
              </Text>
              <Text className="error">{usernameError}</Text>
            </Box> */}
            </Box>

            <FieldArray name="links">
              {({ push, remove }) => (
                <div>
                  {/* <div>
                  <Text
                    fontSize="18px"
                    fontFamily="Sora"
                    fontStyle="normal"
                    fontWeight={600}
                    lineHeight="21px"
                    letterSpacing="0.36px"
                    mt={5}
                    mb={3}
                    color="var(--koii-create-topic)">
                    Add Your Links
                  </Text>
                </div> */}
                  {values.links.map((_, index) => (
                    <Box key={index}>
                      {/* {values.links.length > 1 && index > 0 && (
                      <Text padding="0px 0px 10px" color="var(--koii-create-text)">
                        Link #{index + 1}
                      </Text>
                    )} */}
                      {/* {index === 0 && (
                      <Box className="chooseAnimation">
                        <Text
                          fontSize="16px"
                          fontFamily="Sora"
                          fontStyle="normal"
                          fontWeight={400}
                          lineHeight="20px"
                          letterSpacing="-0.16px"
                          color="var(--koii-create-text)">
                          Your Primary Link
                        </Text>

                        <Text
                          fontSize="12px"
                          mb={5}
                          color={choosenTheme === "Gradient-Two" ? "#353570" : "var(--koii-border-color)"}>
                          Your primary link will stand out with a different color{" "}
                        </Text>
                      </Box>
                    )} */}
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
                              <Text
                                color="var(--koii-create-topic)"
                                width="100%"
                              >
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
                                // className="input-border"
                                // borderRadius={30}
                                // width={{ base: "100%", md: "60%" }}
                              />
                              {/* <StyledInput
                            name={`links.${index}.label`}
                            label="Link Name"
                            as={Input}
                            placeholder="Eg: LinkedIn"
                            isInvalid={errors.links && !!errors.links[index]?.label}
                            /> */}
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
                            {/* <Box w={{ base: "100%", md: "40%" }} display={{ base: "flex", md: "none" }}>
                            <Text mt={0} className="error">
                              <ErrorMessage name={`links.${index}.label`} />
                            </Text>
                          </Box> */}
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
                              {/* <Field
                              color="var(--koii-create-text)"
                              background="var(--koii-input-bg-color)"
                              style={{
                                borderRadius: "20px",
                                color: "var(--koii-create-text)",
                              }}
                              className="input-border"
                              name={`links.${index}.redirectUrl`}
                              label="Link URL"
                              as={Input}
                              borderRadius={30}
                              width={{
                                base: "100%",
                                md: `70%`,
                              }}
                            /> */}
                              <Box
                                display="flex"
                                alignItems="center"
                                gap="10px"
                              >
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
                                  // className="input-border"
                                  // borderRadius={30}
                                  // width={{ base: "100%", md: "60%" }}
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
                            {/* <Box w={{ base: "100%", md: "58%" }} display={{ base: "flex", md: "none" }}>
                            <Text mt={0} className="error">
                              <ErrorMessage name={`links.${index}.redirectUrl`} />
                            </Text>
                          </Box> */}
                          </Box>
                          {index === 0 ? (
                            <div style={{ marginTop: "17px" }}>
                              {" "}
                              {/* <IconButton
                              rounded="full"
                              icon={<DeleteIcon />}
                              style={{ color: '#A6A6A6' }}
                              opacity={0}
                              // colorScheme="red"
                              alignSelf={{ base: "flex-end", lg: "" }} */}
                              {/* <DeleteIcon style={{ color: '#A6A6A6', fontSize: '1.3rem', cursor: 'pointer' }} /> */}
                            </div>
                          ) : (
                            <Box
                              display={{ base: "none", md: "flex" }}
                              style={{}}
                            >
                              {/* <IconButton
                              rounded="full"
                              icon={<DeleteIcon />}
                              style={{ color: '#A6A6A6' }}
                              // colorScheme="red"
                              alignSelf={{ base: "flex-end", lg: "" }}
                              onClick={() => remove(index)}
                            /> */}
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
                              <ErrorMessage
                                name={`links.${index}.redirectUrl`}
                              />
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
                  {/* <Button
                  mt={4}
                  leftIcon={<AddIcon />}
                  rounded="full"
                  borderColor="var(--koii-border-color)"
                  color={choosenTheme === "Gradient-Two" ? "#353570" : "var(--koii-border-color)"}
                  variant="outline"
                  onClick={() => push(linksGroup)}
                  borderRadius="50%"
                  opacity="1"
                  backgroundColor={"var(--koii-input-bg-color)"}>
                  </Button> */}
                  <Box
                    display="flex"
                    alignItems="center"
                    gap="8px"
                    mt={{ base: "0", md: 5 }}
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

            <Divider my={5} color="#C5C5C5" borderWidth="1px" />

            <PersonalizeLinktree
              colorScheme={colorScheme}
              choosenTheme={choosenTheme}
              handleThemeSelection={handleThemeSelection}
              handleLabelSelection={handleLabelSelection}
              values={values}
              choosenLabelTheme={choosenLabelTheme}
            />

            <Button
              w="full"
              // maxW="254px"
              rounded="full"
              color={choosenTheme === "Gradient" ? "#040311" : "white"}
              background={buttonBgColors[choosenTheme]}
              _disabled={{
                background: buttonBgColors[choosenTheme],
                opacity: "30%",
              }}
              _hover={{
                background: buttonBgColors[choosenTheme],
                opacity: "0.9",
              }}
              height="4.125rem"
              mx="auto"
              mt={10}
              type="submit"
              isLoading={!!magicPayload || isUploadingImage || isSubmitting}
              isDisabled={!!magicPayload || isUploadingImage || isSubmitting}
              alignSelf="center"
            >
              {}

              <> {isLoading ? <Spinner /> : registerLinkText}</>
            </Button>
            <>
              <Box mt={7}>
                <Text textAlign="center" color="var(--koii-create-topic)" fontWeight="700">
                  {user?.email}
                </Text>
                <Text textAlign="center" color="var(--koii-create-topic)" fontWeight="400">
                  <strong>Wallet Address:</strong> {user?.publicKey}
                </Text>
              </Box>
            </>
          </form>
        );
      }}
    </Formik>
  );
}

export default LinktreeForm;
