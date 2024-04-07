
export const handleCopy = (text, toast) => {

    navigator.clipboard.writeText(`https://moti.bio/${text}`)
    toast({
     title: "Link Copied",
      status: "success",
      duration: 1000,
      isClosable: true,
      position: "top",
    })
  }