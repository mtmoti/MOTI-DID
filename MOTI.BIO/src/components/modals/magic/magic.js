import { Magic } from "magic-sdk";
import { SolanaExtension } from "@magic-ext/solana";

const magic = new Magic("pk_live_0B806DF108602DBF", {
  extensions: [
    new SolanaExtension({
      rpcUrl: "https://testnet.koii.live",
    }),
  ],
});
magic.user.isLoggedIn();

export default magic;
