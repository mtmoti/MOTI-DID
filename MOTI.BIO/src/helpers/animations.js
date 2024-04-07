export function animatedSection() {
  let images = ["/images/welcome-page-phone-pic.png", "/images/welcom-page-mobile-2.png", "/images/welcome-page-mobile-3.png"];
  let currentIndex = 0;
  document.head.appendChild(document.createElement("style")).innerHTML =
  `@keyframes change-img-anim {
    0%{ opacity: 0;}
    10%{ opacity: 1;}
    90%{ opacity: 1;}
    100%{ opacity: 0;}
  }
   #animated-image-frame { 
    animation: myAnim 2s ease 0s 1 normal forwards;
   }`;

  let imgElement = document.getElementById("animated-image-frame");
  if (imgElement) imgElement.style.backgroundImage = images[currentIndex++];

  // Define the image swapping function
  function preSwapImage() {
    function swapImage() {
      imgElement = document.getElementById("animated-image-frame");

      if (!imgElement) return;

      imgElement.src = images[currentIndex % images.length];
      currentIndex++;
      setTimeout(swapImage, 2500);
    }

    setTimeout(swapImage, 1250);
  }
  preSwapImage();
}
