import React from "react";
import {
  Box,
  // Button,
  // Flex,
  Text,
  Stack,
  Radio,
  RadioGroup,
} from "@chakra-ui/react";

const colorThemeStyle = {
  borderRadius:"50%", 
  height:{base: "4rem", md: "5.6rem"}, 
  width:{base: "4rem", md: "5.6rem"}
}

// const linkStyle = {
// borderRadius:"60px",
// height:"4rem",
// width:"13rem"
// }

const Wrapper = ({ children, colorScheme, value, choosenTheme, height, width, borderRadius, ...rest }) => {
  const borderColor = ["Gradient", "Dark"].includes(choosenTheme) ? "white" : "black"
  return <Radio
    value={value}
    colorScheme={colorScheme}
    size='lg'
    // borderColor='var(--koii-border-color)'
    hidden
    {...rest}
  >
    {/* <Box border={choosenTheme === value ? `1.5px solid ${borderColor}` : 'none'} borderRadius="50%" height="90px" width="90px" display="flex" alignItems="center" justifyContent="center"> */}
    <Box border={choosenTheme === value ? `1.5px solid ${borderColor}` : 'none'} borderRadius={borderRadius} height={height} width={width} display="flex" alignItems="center" justifyContent="center">
      {children}
    </Box>
  </Radio>
}

export const PersonalizeLinktree = ({
  colorScheme,
  choosenTheme,
  handleThemeSelection,
  // handleLabelSelection,
  // values,
  // choosenLabelTheme,
}) => {

  // const borderColor = ["Gradient", "Dark"].includes(choosenTheme) ? "white" : "black"

  return (
    <>
      <Text
        fontSize='1.25rem'
        fontFamily='Poppins'
        fontStyle='normal'
        fontWeight="700"
        lineHeight='26px'
        letterSpacing='0.36px'
        mt={5}
        mb={3}
        color='var(--koii-create-topic)'
      >
        Personalize Your Profile
      </Text>

      <Box
        color='white'
        // flexDirection={{ base: "column", md: "row" }}
        // alignItems={{ base: "flex-start", md: "flex-end" }}
        width='100%'
        // gap={{ base: "10px", md: "5px" }}
      >
        <Box maxW={{ base: "100%" }}>
          <Text
            fontSize='1rem'
            fontFamily='Poppins'
            fontStyle='normal'
            fontWeight="700"
            lineHeight='20px'
            letterSpacing='0.36px'
            color='var(--koii-create-topic)'
            alignItems='center'
          >
            Background color themes
          </Text>
          <Text
            fontSize='12px'
            fontFamily='Sora'
            fontStyle='normal'
            fontWeight={400}
            lineHeight='16px'
            color='#6B6B72'
            alignItems='center'
            mt='10px'
          >
            This will determine your background color, buttons and other graphic
            elements.
          </Text>
        </Box>
        <Box
          width={{ base: "100%", md: "60%" }}
          mt={5}
        >
          <Stack direction={{ base: "column", md: 'row' }} width='100%'>
            <RadioGroup
              onChange={handleThemeSelection}
              value={choosenTheme}
              width='100%'
            >
              <Stack
                direction='row'
                gap='10px'
                justifyContent='space-between'
                width='100%'
              >
                {/* <Radio
                  value='Mint'
                  colorScheme={colorScheme}
                  size='lg'
                  borderColor='var(--koii-border-color)'
                  hidden
                > */}
                  {/* <Box border={choosenTheme === "Mint" ? "1.5px solid black" : 'none'} borderRadius="50%" height="90px" width="90px" display="flex" alignItems="center" justifyContent="center">
                    <img src="/images/ColorTheme1.png" />
                  </Box> */}
                  {/* <Box
                    p='4'
                    width='88px'
                    height='88px'
                    borderRadius="50%"
                    color='black'
                    borderWidth={choosenTheme === "Mint" ? "2px" : "1px"}
                    borderColor={"#F0F0F0"}
                    backgroundColor='#C7F2EF'
                  ></Box> */}
                {/* </Radio> */}
                <Wrapper {...colorThemeStyle} colorScheme={colorScheme} value="Mint" choosenTheme={choosenTheme}>
                  <img alt="theme 1" src="/images/ColorTheme1.png" />
                </Wrapper>

                {/* <Radio
                  value='Dark'
                  colorScheme={colorScheme}
                  size='lg'
                  borderColor='var(--koii-border-color)'
                  hidden
                >
                  <Box border={choosenTheme === "Dark" ? "1.5px solid white" : 'none'} borderRadius="50%" height="90px" width="90px" display="flex" alignItems="center" justifyContent="center">
                    <img src="/images/ColorTheme2.png" />
                  </Box> */}
                  {/* <Box
                    p='4'
                    width='70px'
                    borderRadius={20}
                    color='white'
                    borderWidth={choosenTheme === "Dark" ? "2px" : "1px"}
                    borderColor={"var(--koii-border-color)"}
                    backgroundColor='#171753'
                  ></Box> */}
                {/* </Radio> */}

                <Wrapper {...colorThemeStyle} choosenTheme={choosenTheme} value="Dark" colorScheme={colorScheme}>
                    <img alt="theme 2" src="/images/ColorTheme2.png" />
                </Wrapper>

                {/* <Radio
                  value='Gradient'
                  colorScheme={colorScheme}
                  size='lg'
                  borderColor='var(--koii-border-color)'
                  hidden
                >
                  <Box border={choosenTheme === "Gradient" ? "1.5px solid black" : 'none'} borderRadius="50%" height="90px" width="90px" display="flex" alignItems="center" justifyContent="center">
                    <img src="/images/ColorTheme3.png" />
                  </Box> */}
                  {/* <Box
                    width='70px'
                    borderRadius={20}
                    p='4'
                    color='white'
                    borderWidth={choosenTheme === "Gradient" ? "2px" : "1px"}
                    borderColor={"var(--koii-border-color)"}
                    background='linear-gradient(180deg, #8989C7 0%, #5ED9D1 100%)'
                  ></Box> */}
                {/* </Radio> */}

                <Wrapper {...colorThemeStyle} choosenTheme={choosenTheme} value="Gradient" colorScheme={colorScheme}>
                    <img alt="color theme 4" src="/images/ColorTheme3.png" />
                </Wrapper>

                {/* <Radio
                  value='Gradient-Two'
                  colorScheme={colorScheme}
                  size='lg'
                  borderColor='var(--koii-border-color)'
                  hidden
                >
                  <Box border={choosenTheme === "Gradient-Two" ? "1.5px solid black" : 'none'} borderRadius="50%" height="90px" width="90px" display="flex" alignItems="center" justifyContent="center">
                    <img src="/images/ColorTheme4.png" />
                  </Box> */}
                  {/* <Box
                    p='4'
                    width='70px'
                    borderRadius={20}
                    color='black'
                    borderWidth={
                      choosenTheme === "Gradient-Two" ? "2px" : "1px"
                    }
                    borderColor={"var(--koii-border-color)"}
                    background='linear-gradient(180deg, #FFEE81 0.01%, #FFA6A6 100%)'
                  ></Box> */}
                {/* </Radio> */}

                <Wrapper {...colorThemeStyle} choosenTheme={choosenTheme} colorScheme={colorScheme} value="Gradient-Two" >
                    <img alt="theme 4" src="/images/ColorTheme4.png" />
                </Wrapper>
              </Stack>
            </RadioGroup>
          </Stack>
        </Box>
      </Box>
      <Box
        // display='flex'
        // alignItems={{ base: "flex-start", md: "center" }}
        // justifyItemsItems={{ base: "flex-start", md: "center" }}
        // gap={{ base: "10px", md: "5px" }}
        // flexDirection={{ base: "column", md: "row" }}
        width='100%'
        mt={7}
      >
        {/* <Text
          fontSize='1rem'
          fontFamily='Poppins'
          fontStyle='normal'
          fontWeight="700"
          lineHeight='20px'
          letterSpacing='0.36px'
          color='var(--koii-create-topic)'
          // width={{ md: "40%" }}
        >
          Choose Your Primary Link Style
        </Text>
        <Text
          fontSize='0.8rem'
          fontFamily='Poppins'
          fontStyle='normal'
          fontWeight="500"
          lineHeight='19px'
          color='#6B6B72'
          // width={{ md: "40%" }}
        >
          This will determine your primary link style.
        </Text>
        <Flex mt={5} gap='10' width={{ base: "100%", md: "60%" }}>
          <RadioGroup
            onChange={handleLabelSelection}
            value={choosenLabelTheme}
            width='100%'
          >
            <Stack
              direction={{base: 'column', md: 'row'}}
              gap='10px'
              justifyContent='space-between'
              width='100%'
            >
                <Wrapper size={{ base: "md", md: "lg" }} {...linkStyle} choosenTheme={choosenLabelTheme} value="label-one" colorScheme={colorScheme}>
                  <Button
                    background='linear-gradient(92.39deg, #0E9BF4 23.13%, #2BD4BE 110.39%), linear-gradient(0deg, #D5D5D5, #D5D5D5)'
                    color='white'
                    width='12.4rem'
                    height="3.3rem"
                    borderRadius="60px"
                    fontFamily="Poppins"
                    fontWeight="600"
                    fontSize="1rem"
                    _hover={{ background: 'linear-gradient(92.39deg, #0E9BF4 23.13%, #2BD4BE 110.39%), linear-gradient(0deg, #D5D5D5, #D5D5D5)' }}
                    >
                    {values?.links[0]?.label || "Label"}
                  </Button>
                </Wrapper>  

              <Wrapper size={{ base: "md", md: "lg" }} {...linkStyle} choosenTheme={choosenLabelTheme} value="label-two" colorScheme={colorScheme}>
                <Button
                  background='linear-gradient(98.71deg, #EA3861 5.67%, #EF8571 93.26%)'
                  color='white'
                  width='12.4rem'
                  height="3.3rem"
                  borderRadius="60px"
                  fontFamily="Poppins"
                  fontWeight="600"
                  fontSize="1rem"
                  _hover={{ background: 'linear-gradient(98.71deg, #EA3861 5.67%, #EF8571 93.26%)' }}
                  >
                  {values?.links[0]?.label || "Label"}
                </Button>
              </Wrapper>

              <Wrapper size={{ base: "md", md: "lg" }} {...linkStyle} choosenTheme={choosenLabelTheme} value="label-three" colorScheme={colorScheme}>
                <Button
                  background='#FFFFFF'
                  color='black'
                  width='12.4rem'
                  height="3.3rem"
                  borderRadius="60px"
                  fontFamily="Poppins"
                  fontWeight="600"
                  fontSize="1rem"
                  _hover={{ background: '#FFFFFF' }}
                  >
                  {values?.links[0]?.label || "Label"}
                </Button>
              </Wrapper>
            </Stack>
          </RadioGroup>
        </Flex> */}
      </Box>
    </>
  );
};
