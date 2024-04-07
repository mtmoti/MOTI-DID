import React, { useEffect } from "react";
import {
  Box,
  Spinner,
  IconButton,
  Tooltip,
  Image,
  Text,
  Button,
  useDisclosure,
  ModalHeader,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  ModalFooter,
  InputGroup,
  Input,
  InputRightElement,
  useToast,
  InputLeftAddon,
} from "@chakra-ui/react";
import DeleteSvg from "../icons/delete";
import SettingsSvg from "../icons/settings";
// import { TwitterTimelineEmbed } from "react-twitter-embed";
import "../../css/ButtonAnimations.css";
import { createThemeApplier } from "../../helpers";
// import { buttonBgColors } from "../form";
import { Share2, X, Copy } from "lucide-react";
import { useSelector } from "react-redux";
import { handleCopy } from "../../helpers/copyText";
import { Link } from "react-router-dom";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  EmailShareButton,
  FacebookIcon,
  XIcon,
  WhatsappIcon,
  EmailIcon,
} from "react-share";
// import { useNavigate } from "react-router-dom"
const ShareComponent = ({ shareLink, size }) => {
  return (
    <Box display={"flex"} justifyContent={"space-between"}>
      <FacebookShareButton url={shareLink} style={{ padding: "10px" }}>
        <FacebookIcon size={size} round />
      </FacebookShareButton>

      {/* Assuming Instagram sharing isn't supported by react-share */}

      <TwitterShareButton
        url={shareLink}
        title={"Check out my MOTI.BIO profile at "}
        style={{ padding: "10px" }}
      >
        <XIcon size={size} round />
      </TwitterShareButton>

      <EmailShareButton
        // url={shareLink}
        subject={"Check out my MOTI.BIO profile!"}
        body={"Check out my MOTI.BIO profile at  " + shareLink}
        style={{ padding: "10px" }}
        openShareDialogOnClick
      >
        <EmailIcon size={size} round />
      </EmailShareButton>

      <WhatsappShareButton
        url={shareLink}
        title={"Check out my MOTI.BIO profile at "}
        style={{ padding: "10px" }}
      >
        <WhatsappIcon size={size} round />
      </WhatsappShareButton>
    </Box>
  );
};
function SingleLinktree({
  isLoading,
  isProfileOwner,
  userData,
  handleDeleteLinktree,
  handleEditLinktree,
  // publicKey,
  noProfileText,
  // username,
}) {
  useEffect(() => {
    document.title = `${userData?.name} | MOTI.BIO`;
  }, []);
  // const labelBackground = `var(--koii-${
  //   userData?.choosenLabelTheme || "label-one"
  // }-color)`;
  // const labelText = `var(--koii-${
  //   userData?.choosenLabelTheme || "label-one"
  // }-text-color)`;
  // const labelBorder = `var(--koii-${
  //   userData?.choosenLabelTheme || "label-one"
  // }-border-color)`;

  const buttonBgColors = {
    Dark: "linear-gradient(92.39deg, #0E9BF4 23.13%, #2BD4BE 110.39%)",
    Mint: "#232121",
    Gradient: "linear-gradient(94.11deg, #F9A443 3.58%, #EA8224 98.65%)",
    "Gradient-Two": "#734C3D",
  };

  const user = useSelector((state) => state.user);

  // const navigate = useNavigate()
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (userData?.name) document.title = `${userData?.name} | MOTI.BIO`;
    setTimeout(() => {
      createThemeApplier(userData?.theme);
    }, 500);
  }, [userData?.theme, userData?.name]);

  const color = ["Gradient", "Dark"].includes(userData?.theme)
    ? "white"
    : "black";
  const Logo = ["Gradient", "Dark"].includes(userData?.theme)
    ? "/images/DarkThemeLogo.png"
    : "/images/logo.png";
  const toast = useToast();

  const shareLink = `https://www.moti.bio/${userData?.linktreeAddress}`;

  return (
    <>
      <Box
        width="100%"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        padding="2rem 2rem 0 2rem"
      >
        <Link to="https://moti.bio">
          <img src={Logo} alt="main logo" style={{ height: "40px" }} />
        </Link>
        <Button
          onClick={onOpen}
          _hover={{ color, opacity: "0.9" }}
          display={{ base: "none", md: "flex" }}
          color={color}
          leftIcon={<Share2 color={color} size="20px" />}
          backgroundColor="transparent"
          width="7.8rem"
          height="2.5rem"
          borderRadius="90px"
          border={`1px solid ${color}`}
        >
          Share
        </Button>
        <Box
          cursor="pointer"
          onClick={onOpen}
          display={{ base: "block", md: "none" }}
        >
          <Share2 color={color} size="20px" />
        </Box>
      </Box>

      <Box position="relative" width="100%">
        {/* {isProfileOwner && userData && (
        <>
          <Box
            position='absolute'
            top={{ base: "20px", md: "32px" }}
            right={{ base: "70px", md: "80px" }}
          >
            <Tooltip
              hasArrow
              label='Delete Profile'
              bg='#ecfffe'
              fontSize='sm'
              color='#171753'
            >
              <IconButton
                rounded='full'
                // alignSelf={{ base: "flex-end", lg: "" }}
                marginTop='10px'
                size='sm'
                icon={<DeleteSvg />}
                backgroundColor={"var(--koii-icon-bg-color)"}
                color={"var(--koii-icon-color)"}
                onClick={handleDeleteLinktree}
                boxShadow='0px 2px 4px 0px #00000029'
              />
            </Tooltip>
          </Box>

          {
            <Box
              position='absolute'
              top={{ base: "20px", md: "32px" }}
              right={{ base: "20px", md: "32px" }}
            >
              <Tooltip
                hasArrow
                label='Edit Profile'
                bg='#ecfffe'
                fontSize='sm'
                color='#171753'
              >
                <IconButton
                  rounded='full'
                  alignSelf={{ base: "flex-end", lg: "" }}
                  marginTop='10px'
                  size='sm'
                  pb='-2px'
                  icon={<SettingsSvg />}
                  backgroundColor={"var(--koii-icon-bg-color)"}
                  color={"var(--koii-icon-color)"}
                  onClick={handleEditLinktree}
                  boxShadow='0px 2px 4px 0px #00000029'
                />
              </Tooltip>
            </Box>
          }
        </>
      )} */}
        <Box
          minHeight="82vh"
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyItems="center"
          className="container"
        >
          {isLoading ? (
            <Box
              height="100%"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyItems="center"
            >
              <Spinner height="50px" width="50px" />
            </Box>
          ) : (
            <Box
              width="100%"
              display="flex"
              alignItems="center"
              flexDirection="column"
            >
              {userData && (
                <>
                  {/* {userData?.image && ( */}
                  <Image
                    height="12.5rem"
                    width="12.5rem"
                    src={
                      userData?.image
                        ? userData?.image
                        : "/images/DefaultUserProfile.png"
                    }
                    alt={userData?.name}
                    className="user-image"
                  />

                  <Text
                    fontSize="3rem"
                    fontFamily="Poppins"
                    fontWeight="700"
                    lineHeight="3.5rem"
                    width="100%"
                    textAlign={"center"}
                    maxWidth={"750px"}
                    className="user-name"
                  >
                    {" "}
                    {userData?.name}{" "}
                  </Text>
                  <Text
                    fontSize="1.5rem"
                    fontFamily="Poppins"
                    fontWeight="500"
                    className="user-desc"
                  >
                    {userData?.description
                      ?.split("\n")
                      .map((line, index, array) => (
                        <React.Fragment key={index}>
                          {line}
                          {index < array.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                  </Text>

                  <div className="links">
                    {userData?.links?.map((link, index) => (
                      <div className="link-container" key={link?.redirectUrl}>
                        {/* <a
                        className={`link ${
                          index === 0 ? userData?.animation : ""
                        }`}
                        key={index}
                        href={link?.redirectUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{
                          fontSize: index === 0 ? "18px" : "inherit",
                          color: index === 0 ? labelText : "inherit",
                          background:
                            index === 0
                              ? labelBackground
                              : "var(--koii-button-bg)",
                          borderColor:
                            index === 0
                              ? labelBorder
                              : "var(--koii-button-text)",
                        }}
                      >
                        {link.label}
                      </a> */}
                        <a
                          href={link?.redirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            color={
                              index === 0
                                ? userData?.theme === "Gradient"
                                  ? "#040311"
                                  : "white"
                                : "black"
                            }
                            width={{ base: "20rem", md: "29.3rem" }}
                            height="3.6rem"
                            borderRadius="70px"
                            disabled={{
                              background: buttonBgColors[userData?.theme],
                              opacity: "30%",
                            }}
                            _hover={{
                              background:
                                index === 0
                                  ? buttonBgColors[userData?.theme]
                                  : "white",
                              opacity: "0.9",
                            }}
                            mt="15px"
                            background={
                              index === 0
                                ? buttonBgColors[userData?.theme]
                                : "white"
                            }
                          >
                            {link.label}
                          </Button>
                        </a>
                        {/* {link.redirectUrl.startsWith("https://twitter.com/") && (
                        <div
                          className='hover-div'
                          style={{
                            borderRadius: "5px",
                            backgroundColor: "transparent",
                          }}
                          >
                          <TwitterTimelineEmbed
                          sourceType='profile'
                          screenName={link.redirectUrl
                              .replace(/\/$/, "")
                              .split("/")
                              .pop()}
                            options={{ height: 400, width: 400 }}
                          />
                        </div>
                      )} */}
                        {/* 
                      {link?.redirectUrl.startsWith("https://youtube.com/") && (
                      <div className="hover-div">
                      <YouTubeEmbed
                      url="https://www.youtube.com/watch?v=HpVOs5imUN0"
                            width={325}
                            height={220}
                          />
                        </div>
                      )}

                      {link?.redirectUrl.startsWith(
                        "https://linkedin.com/"
                      ) && (
                        <div className="hover-div">
                          <LinkedInEmbed
                            url="https://www.linkedin.com/embed/feed/update/urn:li:share:6898694772484112384"
                            postUrl="https://www.linkedin.com/posts/peterdiamandis_5-discoveries-the-james-webb-telescope-will-activity-6898694773406875648-z-D7"
                            width={400}
                            height={400}
                          />
                        </div>
                      )} */}
                        <div
                          style={{ display: "flex", justifyContent: "center" }}
                        ></div>
                      </div>
                    ))}
                  </div>

                  {/* {publicKey && (
                  <p>
                    <a
                      href={`https://linktree.koii.network/${username}`}
                      className='displayLink'
                    >
                      Your linktree profile Link
                    </a>
                  </p>
                )} */}
                </>
              )}
              {!userData && !isLoading && <p>{noProfileText}</p>}
            </Box>
          )}
        </Box>
        <Text
          fontSize="1rem"
          fontFamily="Poppins"
          fontWeight="600"
          color="var(--koi-create-topic)"
          className="footer footer-color"
        >
          {!isProfileOwner && (
            <>
              <a
                href="https://www.moti.bio/"
                style={{
                  color: "var(--koii-create-topic)",
                  fontSize: "1.2rem",
                  fontFamily: "Poppins",
                  fontWeight: "600",
                }}
              >
                Claim My MOTI.BIO
              </a>
            </>
          )}
          {isProfileOwner && (
            <Link
              to={`/edit-bio/${userData?.linktreeAddress}`}
              style={{
                fontSize: "1.2rem",
                fontFamily: "Poppins",
                fontWeight: "600",
                textDecoration: "none",
                color: "var(--koii-create-topic)",
              }}
            >
              Edit My MOTI.BIO
            </Link>
          )}
        </Text>
      </Box>

      <Modal
        isCentered
        onClose={onClose}
        isOpen={isOpen}
        motionPreset="slideInBottom"
        backgroundColor="white"
      >
        <ModalOverlay />
        <ModalContent
          maxW="29.5rem"
          width="100%"
          dropShadow="2px 7px 10px 0px #17175340"
          borderRadius="20px"
          bgColor="white"
          // color="#FFFFFF"
        >
          <ModalHeader padding="0px">
            <Box
              padding="21px"
              width="100%"
              position="relative"
              justifyContent="space-between"
              justifyItems="center"
              display="flex"
              // boxShadow="0px 2px 8px 0px #00000029;"
              fontSize="20px"
              lineHeight="24px"
              fontWeight="600"
            >
              {/* <p>Login via Magic.link</p> */}
              <Text
                color="#232121"
                fontFamily="Poppins"
                fontSize="1.2rem"
                fontWeight="600"
              >
                Share
              </Text>
              <Button
                onClick={onClose}
                position="absolute"
                right="16px"
                top="16px"
                cursor="pointer"
                bg="transparent"
                _hover={{
                  bg: "transparent",
                }}
              >
                <X size="20px" />
              </Button>
            </Box>
          </ModalHeader>
          <ModalBody>
            <Box display="flex" justifyContent="space-around">
              {/* <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareLink}`}
                target="_blank"
              >
                <Image cursor="pointer" src="/images/facebook_logo.png" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareLink}`}
                target="_blank"
              >
                <Image cursor="pointer" src="/images/intagram_logo.png" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${shareLink}&text=${encodeURI(
                  "Check out my motio.bio profile!"
                )}`}
                target="_blank"
              >
                <Image cursor="pointer" src="/images/twitter_logo.png" />
              </a>
              <a
                href={`mailto:info@example.com?&subject=Check+out+my+moti.bio+profile!&cc=&bcc=&body=my+moti.bio+profile:${shareLink}\n${encodeURI(
                  "Check out my moti.bio profile"
                )}`}
                target="_blank"
              >
                <Image cursor="pointer" src="/images/gmail_logo.png" />
              </a>
              <a
                href={`whatsapp://send?text=checkout my moti.bio profile: ${shareLink}`}
                target="_blank"
              >
                <Image cursor="pointer" src="/images/whatsapp_logo.png" />
              </a> */}

              {/* <Image src="/images/facebook_logo.png" /> */}
            </Box>
            <ShareComponent shareLink={shareLink}></ShareComponent>
          </ModalBody>
          <ModalFooter>
            <Box
              width="100%"
              display="flex"
              alignItems="center"
              justifyItems="center"
              justifyContent="center"
              pb="10px"
            >
              {/* <Login /> */}
              <InputGroup>
                {/* <InputLeftAddon
                  backgroundColor="#D5D5D5"
                  border="none"
                  height="3rem"
                  color="black"
                  paddingRight="0px !important"
                >
                  moti.bio/
                </InputLeftAddon> */}
                <Input
                  color="black"
                  disabled
                  _disabled={{
                    backgroundColor: "#D5D5D5",
                    opacity: "1",
                    border: "1px solid #D5D5D5",
                    // paddingLeft: "100px !important",
                  }}
                  defaultValue={"moti.bio/" + userData?.linktreeAddress}
                />
                <InputRightElement
                  onClick={() => handleCopy(userData?.linktreeAddress, toast)}
                  cursor="pointer"
                  ml="10px"
                  mt={1}
                >
                  <Copy color="#494747" />
                </InputRightElement>
              </InputGroup>
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default SingleLinktree;
