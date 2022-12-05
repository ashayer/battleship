"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../styles/global.css");
const react_1 = require("next-auth/react");
const trpc_1 = require("utils/trpc");
const MyApp = ({ Component, pageProps, }) => {
    return (<react_1.SessionProvider session={pageProps.session}>
      <Component {...pageProps}/>
    </react_1.SessionProvider>);
};
MyApp.getInitialProps = async ({ ctx }) => {
    return {
        session: await (0, react_1.getSession)(ctx),
    };
};
exports.default = trpc_1.trpc.withTRPC(MyApp);
