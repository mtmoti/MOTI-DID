import React from "react";
import {Link} from "react-router-dom"
import "../../App.css";
import { Text, Box, Image } from "@chakra-ui/react";
// import koiiChatFish from "../../pages/images/koiiChat.svg";
import GetFinnieModal from "../modals";

const HomeComponent = ({ handleConnectFinnie, connectButtonText, total }) => {

  return (
    <>
    <Box display="flex" justifyContent="flex-start" gap="10px" alignItems="center" padding={{base: "1rem 1rem 0 1rem", md:"2rem 2rem 0 2rem"}}>
    <Link style={{display:"flex" ,justifyContent:"flex-start", gap:"10px", alignItems:"center"}} to = "https://moti.bio">
      <img src="/images/DarkThemeLogo.png" alt="main logo" style={{height:"40px"}} />
      <Text fontFamily="Poppins" fontSize="2rem" fontWeight="600" color="#FFFFFF">MOTI.BIO</Text>
      {/* <Button _hover={{ color, opacity: '0.9' }} color={color} leftIcon={<LogOut color={color} size="20px" />} backgroundColor="transparent" width="7.8rem" height="2.5rem" borderRadius="90px" border={`1px solid ${color}`}>Logout</Button> */}
    </Link>
    </Box>
    <div className="Home">
      <div className="psuedoBackground"></div>
      <div className="container public-key-input-container connect-container">
        <div className="auth-user">
          <Box
            display="flex"
            flexDirection={{ base: 'column', md: 'row' }}
            alignItems="center"
            marginTop={50}
            justifyContent="center"
            minHeight="500px"
          >
            <Box
              id="animated-image-container"
              marginRight={{ base: "0px", md: "100px"}}
              // mt={{ base: "25rem", md: "0px" }}
              // height="450px"
              // display={{ base: "none", md: "block" }}
            >
              <Image
                width={{ base: "100%", md: "19.2rem" }}
                // height={{ base: "25rem", md: "35rem" }}
                objectFit={"contain"}
                id="animated-image-frame"
                alt="frame"
              />
            </Box>
            <Box
              marginTop={{ base: '50px', md: '0px' }}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
                height: "100%", // You can adjust this based on your layout
              }}
            >
              {/* <Image
                src={koiiChatFish}
                alt="Koii Chat Fish"
                maxW="60px" // Set the maximum width to control the size
                h="auto" // Allow the height to adjust automatically
              /> */}
              {/* <Text
                fontSize={{ base: "26px", md: "52px" }}
                textAlign="center"
                maxWidth="600px"
                fontFamily="Sora, sans-serif"
                fontWeight="600"
                color="#8989C7"
              >
                Welcome to
              </Text> */}
              <Text
                fontSize={{ base: "2rem", md: "4rem" }}
                textAlign={{base: "center", md: "left"}}
                maxWidth="650px"
                fontFamily="Poppins"
                fontWeight="600"
                background="linear-gradient(270.49deg, #FEA973 0.17%, #F476B7 50.01%, #9E6CF5 96.95%)"
                style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                marginTop={"-20px"}
                lineHeight={{base: "2.8rem", md: "5.2rem"}}
              >
                {/* <a
                  href="https://www.koii.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                > */}
                  Your Passport To Decentralized Social Web
                {/* </a>{" "} */}
              </Text>

              <Text
                my="20px"
                fontSize={{ base: "1rem", md: "1.5rem" }}
                textAlign={{base: "center", md: "left"}}
                maxWidth={{ base: "auto", md: "600px" }}
                width="100%"
                color="#FFFF"
                fontFamily="Poppins"
                fontWeight="500"
                // className="typewriterText"
              >
                Dive into a new era where your identity, privacy & connections are entirely in your hands
              </Text>

              {/* <Button
                onClick={handleConnectFinnie}
                fontFamily="Sora, sans-serif"
                maxWidth="225px"
                w="100%"
                backgroundColor={"#8989C7"}
                color={"white"}
                borderRadius={20}
                border="1.5px solid #8989C7"
                boxShadow="0px 4px 4px 0px #17175380"
              >
                {connectButtonText}
              </Button> */}
              <GetFinnieModal />
            </Box>
          </Box>
        </div>
      </div>

      {/* {total !== null && total !== 0 && total && (
        <div className="footer">
          <Text color="#171753">
            Total{" "}
            <a className="by-koii" href="https://www.koii.network/">
              Koii Linktrees
            </a>{" "}
            created: {total}{" "}
          </Text>
        </div>
      )} */}
    </div>
    </>
  );
};

export default HomeComponent;
