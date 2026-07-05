# BountyBay Bundle String Contexts

Source: `competitor-profiles/raw/bountybay/2026-07-05/scrapes/app-bundle.js`
Generated: 2026-07-05

This file is a compact evidence index extracted from the minified public app bundle. It is not a full decompilation.

## Route Strings
- `/admin`
- `/admin/*`
- `/admin/creator-search`
- `/admin/disputes`
- `/admin/support`
- `/admin/support/:ticketId`
- `/auth`
- `/auth?tab=signin`
- `/auth?tab=signup`
- `/b/`
- `/b/:id`
- `/b/:id/edit`
- `/bounties`
- `/checkout`
- `/collectibles`
- `/connect-complete`
- `/delete-account`
- `/earn`
- `/faq`
- `/fashion`
- `/how-it-works`
- `/hunter-tiers`
- `/identity-complete`
- `/legal/privacy`
- `/legal/terms`
- `/lost-media`
- `/me/`
- `/me/bounties`
- `/me/bounties?tab=applied`
- `/me/bounties?tab=posted`
- `/me/bounties?tab=reviews`
- `/me/profile`
- `/me/settings`
- `/messages`
- `/plushies-blankets`
- `/post`
- `/reset-password`
- `/reset-password?mode=recovery`
- `/setup`
- `/support`
- `/support/`
- `/support/:ticketId`
- `/team`
- `/u/`
- `/u/:userId`
- `/verification`
- `/vintage-cars`

## Term Contexts

### Post a Bounty
- re offline â saved bounties still work."})]})}const cA="bb_native_welcome_seen_v1";function Iie(){const[e,t]=g.useState(!1);g.useEffect(()=>{if(!Je.isNativePlatform())return;let n=!1,a;return(async()=>{const i=await Vu(cA);n||i==="1"||(a=window.setTimeout(()=>{n||t(!0)},800))})(),()=>{n=!0,a&&window.clearTimeout(a)}},[]);const r=()=>{ov(cA,"1"),t(!1)};return Je.isNativePlatform()?s.jsx(Mr,{open:e,onOpenChange:n=>{n||r()},children:s.jsxs(Cr,{className:"max-w- ...
- How do I post a bounty?
- Click 'Post a Bounty' and describe what you're looking for. Add photos if you have them, set your finder's fee (reward), specify your budget for the item itself, set a deadline, and fund the escrow. Your reward is held securely until a hunter delivers.
- Looking for something specific? Post a bounty and let our community find it for you.
- Post a Bounty
- When you post a bounty, we securely save your payment method. You're
- t track down. Post a bounty with a reward, and let our hunters dig it up for you.",heroGradient:"bg-gradient-to-br from-violet-500/10 via-background to-indigo-500/5",icon:s.jsx(DD,{className:"h-10 w-10 text-violet-500"}),trustBadgeText:"Community-powered internet archaeology.",ctaText:"Post a Lost Media Bounty",emptyMessage:"No lost media bounties yet",emptyDescription:"Be the first to post a bounty for that deleted post, missing video, or unknown song you
- t be replaced.",description:"BountyBay is the best way to find a discontinued stuffed animal, lost baby blanket, or childhood comfort item. Post a bounty with a reward, and let our hunters track it down for you.",heroGradient:"bg-gradient-to-br from-pink-400/10 via-background to-purple-400/5",icon:s.jsx(BD,{className:"h-10 w-10 text-pink-500"}),trustBadgeText:"ID-verified hunters. Secure escrow. You only pay when found.",ctaText:"Post a Bounty for a Plushie or Blanket",emptyMessage:"No ...

### Create Bounty
- deadline:null,targetPriceMin:ee.targetPriceMin,targetPriceMax:ee.targetPriceMax,tags:C,verificationRequirements:E.filter(Xr=>Xr.trim()),images:M,requires_shipping:We,hunter_purchases_item:Be}}});if(_t){let Xr="Failed to create bounty.";try{const Ur=typeof _t=="string"?JSON.parse(_t):_t;Ur!=null&&Ur.error&&(Xr=Ur.error)}catch{typeof _t.message=="string"&&(Xr=_t.message)}throw new Error(Xr)}t({title:"Bounty posted — sponsored!",description:"Your bount
- deadline:null,targetPriceMin:vt.targetPriceMin,targetPriceMax:vt.targetPriceMax,tags:C,verificationRequirements:E.filter(Ur=>Ur.trim()),images:M,requires_shipping:We,hunter_purchases_item:Be}}});if(Xr){let Ur="Failed to create bounty. Please try again.";try{const vn=typeof Xr=="string"?JSON.parse(Xr):Xr;vn!=null&&vn.error&&(Ur=vn.error),(vn==null?void 0:vn.code)==="CVC_ERROR"&&(Ur="Card security code (CVC) verification failed. Please go back and re-

### bounty goes live
- Funds are held in escrow BEFORE the bounty goes live. The money is already securedâit's not a promise to pay. When you deliver, the funds are released. No chasing payments.

### claim
- claims
- /b/${p.bounty_id}?tab=claims
- ,e.CLAIMED=
- });case Ht.CLAIMED:return s.jsx(le,{className:
- ,title:`${e.claimsCount} claims`,children:[s.jsx(Sn,{className:
- ,{children:e.claimsCount})]}),s.jsxs(
- ,posterRating:Number((t==null?void 0:t.average_rating)||0),posterRatingCount:Number((t==null?void 0:t.total_ratings_received)||0),isOfficial:n||!1,verificationRequirements:e.verification_requirements||[],createdAt:Zh(e.created_at),updatedAt:Zh(e.updated_at||e.created_at),claimsCount:r||0,viewsCount:e.view_count||0,requires_shipping:e.requires_shipping||!1,shippingDetails:e.shipping_details||void 0,shippingStatus:e.shipping_status||void 0,hunterPurchasesItem:e.hunter_purchases_item||!1}}const ...
- ),i=(e-1)*t,{data:o,error:l}=await n.range(i,i+t-1);if(l)throw l;const[c,u]=await Promise.all([this._fetchProfileMap(o),this._fetchClaimsCountMap(o)]);return{data:(o==null?void 0:o.map(d=>{const f={...d};delete f.shipping_details;const h=c.get(d.poster_id);return Co(f,h,u.get(d.id)||0,h==null?void 0:h.isOfficial)}))||[],total:a||0,page:e,limit:t,hasMore:(a||0)>e*t}}catch(n){throw console.error(

### Claim
- claims
- /b/${p.bounty_id}?tab=claims
- ,e.CLAIMED=
- });case Ht.CLAIMED:return s.jsx(le,{className:
- ,title:`${e.claimsCount} claims`,children:[s.jsx(Sn,{className:
- ,{children:e.claimsCount})]}),s.jsxs(
- ,posterRating:Number((t==null?void 0:t.average_rating)||0),posterRatingCount:Number((t==null?void 0:t.total_ratings_received)||0),isOfficial:n||!1,verificationRequirements:e.verification_requirements||[],createdAt:Zh(e.created_at),updatedAt:Zh(e.updated_at||e.created_at),claimsCount:r||0,viewsCount:e.view_count||0,requires_shipping:e.requires_shipping||!1,shippingDetails:e.shipping_details||void 0,shippingStatus:e.shipping_status||void 0,hunterPurchasesItem:e.hunter_purchases_item||!1}}const ...
- ),i=(e-1)*t,{data:o,error:l}=await n.range(i,i+t-1);if(l)throw l;const[c,u]=await Promise.all([this._fetchProfileMap(o),this._fetchClaimsCountMap(o)]);return{data:(o==null?void 0:o.map(d=>{const f={...d};delete f.shipping_details;const h=c.get(d.poster_id);return Co(f,h,u.get(d.id)||0,h==null?void 0:h.isOfficial)}))||[],total:a||0,page:e,limit:t,hasMore:(a||0)>e*t}}catch(n){throw console.error(

### submission
- id, poster_id, status, Submissions!Submissions_bounty_id_fkey!inner( hunter_id, status )
- Submissions.status
- submission_accepted
- submission_rejected
- submission_received
- ,description:`Deleted ${z.deleted} seeded bounties, submissions, and ratings.`})}catch(z){console.error(
- ).length)||0,submission_dispute:(e==null?void 0:e.filter(a=>a.type===
- ).length)||0}}}},joe={platform_issue:Xt,bounty_dispute:Ir,submission_dispute:Ir,payment_issue:Ft,account_issue:wr,bug_report:gm,feature_request:xr,other:Yi},yA={open:

### Review
- t been completed yet.",variant:"destructive"}),t(!1);return}const C=S.poster_id===a.id,A=P.hunter_id===a.id;if(!C&&!A){i({title:"Cannot leave review",description:"You weren
- });return}u(!0);try{const S={rated_user_id:y.userId,bounty_id:r,rating:d,review_text:h.trim()||void 0,rating_type:y.ratingType};await K5(S),i({title:
- t submit review",description:P,variant:"destructive"})}finally{u(!1)}}},N=S=>S.split(" ").map(P=>P[0]).join("").toUpperCase().slice(0,2);return s.jsx(Mr,{open:e,onOpenChange:t,children:s.jsx(Cr,{className:"sm:max-w-md",children:o?s.jsx("div",{className:"flex items-center justify-center py-12",children:s.jsx(Qe,{className:"h-8 w-8 animate-spin text-muted-foreground"})}):v?s.jsxs(s.Fragment,{children:[s.jsxs(_r,{children:[s.jsxs(Nr,{className:"flex items-center ...
- );return e}function Ute({children:e}){const[t,r]=g.useState(!1),[n,a]=g.useState(null),i=l=>{a(l),r(!0)},o=()=>{r(!1),a(null)};return s.jsxs(oL.Provider,{value:{openReviewModal:i,closeReviewModal:o},children:[e,n&&s.jsx(Fte,{open:t,onOpenChange:l=>{l||o()},bountyId:n,onComplete:o})]})}function cn({children:e,allowIncompleteProfile:t=!1}){const{user:r,loading:n}=$t(),a=Fn(),[i,o]=g.useState({status:
- )]})]})]}),y.last_message_preview&&s.jsxs(
- }),y.last_message_preview.substring(0,100),y.last_message_preview.length>100&&
- ).update({status:_,admin_notes:o||null,reviewed_at:new Date().toISOString()}).eq(
- Submitted a claim for review

### hunter
- id, poster_id, status, Submissions!Submissions_bounty_id_fkey!inner( hunter_id, status )
- poster_to_hunter
- t been completed yet.",variant:"destructive"}),t(!1);return}const C=S.poster_id===a.id,A=P.hunter_id===a.id;if(!C&&!A){i({title:"Cannot leave review",description:"You weren
- }),t(!1);return}const T=C?P.hunter_id:S.poster_id,k=C?
- rate_hunter
- ))||[],P=S.reduce((E,O)=>E+(O.platform_fee_amount||0),0),C=S.reduce((E,O)=>E+(O.amount||0),0),A=S.reduce((E,O)=>E+(O.stripe_fee_amount||0),0),T=S.reduce((E,O)=>E+(O.payout_sent_amount||0),0);i({totalPlatformFees:P,totalBountyValue:C,totalStripeFees:A,totalHunterPayouts:T,transactionCount:S.length});const k=new Map;for(const E of S){const O=E.captured_at?new Date(E.captured_at):new Date(E.created_at),R=jt(O,
- ,children:Wt((a==null?void 0:a.totalHunterPayouts)||0,!0)}),s.jsx(
- ,posterRating:Number((t==null?void 0:t.average_rating)||0),posterRatingCount:Number((t==null?void 0:t.total_ratings_received)||0),isOfficial:n||!1,verificationRequirements:e.verification_requirements||[],createdAt:Zh(e.created_at),updatedAt:Zh(e.updated_at||e.created_at),claimsCount:r||0,viewsCount:e.view_count||0,requires_shipping:e.requires_shipping||!1,shippingDetails:e.shipping_details||void 0,shippingStatus:e.shipping_status||void 0,hunterPurchasesItem:e.hunter_purchases_item||!1}}const ...

### Hunters
- ð° No platform fees for posters. Hunters pay $2 + 5% when paid out.
- s next?"}),s.jsxs("ul",{className:"text-sm text-muted-foreground space-y-1",children:[s.jsx("li",{children:"â¢ Post your first bounty or start hunting"}),s.jsx("li",{children:"â¢ Connect with hunters worldwide"}),s.jsx("li",{children:"â¢ Find exactly what you
- BountyBay is a reverse marketplace where you post what you're looking for, and verified hunters find it for you. Think of it as a "finder's fee" marketplaceâyou set a reward, hunters compete to find your item, and you only pay when someone delivers.
- Traditional marketplaces show you what's already listed for sale. BountyBay flips itâyou post what you WANT, and hunters actively search for it. Perfect for rare items, discontinued products, vintage collectibles, or anything hard to find through normal shopping.
- Collectors hunting for rare items, people looking for discontinued products, vintage enthusiasts, sneakerheads chasing limited releases, anyone who's ever thought "I'd pay someone to find this for me." Hunters are often resellers, thrift experts, or people with great sourcing skills.
- Browsing and creating an account is free. Posters pay only when they fund a bounty (reward + Stripe fees). Hunters pay nothing upfrontâa small platform fee is deducted only from successful payouts.
- Be specific: include brand, model, size, color, condition requirements, and any variations you'd accept. Add reference photos. Set a realistic rewardâhunters are more motivated by fair compensation. Clear verification requirements help hunters know exactly what proof you need.
- Depends on rarity. Common items: 1-2 weeks. Rare collectibles: 1-3 months. The rarer the item, the more time hunters need to search. You can always extend deadlines or cancel if needed.

### verified
- MFA_CHALLENGE_VERIFIED
- verified
- ,c.id).single();P&&(f({username:P.username,avatar_url:P.avatar_url}),m(C=>({identity:C.identity||P.identity_verified===!0,payout:C.payout||P.stripe_connect_payouts_enabled===!0,loading:C.loading})))}catch(P){console.error(
- ,{identity:(P=A.error)==null?void 0:P.message,connect:(C=T.error)==null?void 0:C.message}),m(k=>{var E,O,R;return{identity:k.identity||((E=A.data)==null?void 0:E.verified)===!0,payout:k.payout||((O=T.data)==null?void 0:O.payouts_enabled)===!0||((R=T.data)==null?void 0:R.onboarding_complete)===!0,loading:!1}})}catch(A){console.error(
- Holy grail search: Looking for ANY information on surviving Kenner Boba Fett rocket-firing prototypes or early production samples. Will pay this bounty just for a verified lead. Obviously will pay much more for an actual piece. Serious collector with references available.
- Searching for an Apple I computer (will pay significantly more for verified units) or an original Apple II from 1977. Any condition considered for the Apple I. For Apple II, prefer working unit with original case. This is for a tech history museum display.
- ,e))(or||{}),Jo=(e=>(e.NOT_VERIFIED=
- ,e.VERIFIED=

### verification
- ,!0)&&(t.data.weak_password=e.weak_password),t}function Uo(e){var t;return{data:{user:(t=e.user)!==null&&t!==void 0?t:e},error:null}}function PJ(e){return{data:e,error:null}}function EJ(e){const{action_link:t,email_otp:r,hashed_token:n,redirect_to:a,verification_type:i}=e,o=NJ(e,[
- ]),l={action_link:t,email_otp:r,hashed_token:n,redirect_to:a,verification_type:i},c=Object.assign({},o);return{data:{properties:l,user:c},error:null}}function TJ(e){return e}function AJ(e){return e.access_token&&e.refresh_token&&e.expires_in}const jw=[
- VIN verification
- Contents verification
- ).insert({title:z.title,description:`${z.description} ${gA}`,category:z.category,subcategory:z.subcategory,amount:z.amount,location:z.location,tags:z.tags,images:z.images,verification_requirements:z.verification_requirements,poster_id:pA,status:
- ,posterRating:Number((t==null?void 0:t.average_rating)||0),posterRatingCount:Number((t==null?void 0:t.total_ratings_received)||0),isOfficial:n||!1,verificationRequirements:e.verification_requirements||[],createdAt:Zh(e.created_at),updatedAt:Zh(e.updated_at||e.created_at),claimsCount:r||0,viewsCount:e.view_count||0,requires_shipping:e.requires_shipping||!1,shippingDetails:e.shipping_details||void 0,shippingStatus:e.shipping_status||void 0,hunterPurchasesItem:e.hunter_purchases_item||!1}}const ...
- ).insert({title:e.title,description:e.description,category:e.category,subcategory:e.subcategory,location:e.location,amount:e.bountyAmount,target_price_min:e.targetPriceMin,target_price_max:e.targetPriceMax,deadline:(t=e.deadline)==null?void 0:t.toISOString(),tags:e.tags,verification_requirements:e.verificationRequirements,images:e.images,poster_id:r.id,status:
- ).optional(),verificationRequirements:Wh(wt().min(1,

### Stripe
- ,c.id).single();P&&(f({username:P.username,avatar_url:P.avatar_url}),m(C=>({identity:C.identity||P.identity_verified===!0,payout:C.payout||P.stripe_connect_payouts_enabled===!0,loading:C.loading})))}catch(P){console.error(
- My son Oliver passed away 3 years ago at age 6. His favorite comfort blanket - a blue and white striped blanket with satin edges and a small embroidered elephant in the corner - went missing during the chaos of the hospital stay. I've searched eBay, Facebook Marketplace, Etsy, and every thrift store within 100 miles for 3 years. The brand was 'Little Miracles' from Target, sold around 2016-2017. It had a specific pattern I can describe in detail. I just want to hold what he held. Money is no ...
- ,{body:{stripe_account_id:v.trim()}});if(H)throw H;k({title:
- ).select(` id, amount, platform_fee_amount, stripe_fee_amount, total_charged_amount, payout_sent_amount, captured_at, created_at, capture_status, bounty_id `).eq(
- ))||[],P=S.reduce((E,O)=>E+(O.platform_fee_amount||0),0),C=S.reduce((E,O)=>E+(O.amount||0),0),A=S.reduce((E,O)=>E+(O.stripe_fee_amount||0),0),T=S.reduce((E,O)=>E+(O.payout_sent_amount||0),0);i({totalPlatformFees:P,totalBountyValue:C,totalStripeFees:A,totalHunterPayouts:T,transactionCount:S.length});const k=new Map;for(const E of S){const O=E.captured_at?new Date(E.captured_at):new Date(E.created_at),R=jt(O,
- ,((A=S.stripe_fee_amount)==null?void 0:A.toFixed(2))||
- ,captured_at:new Date().toISOString(),total_charged_amount:N,stripe_fee_amount:_,platform_fee_amount:b,payout_sent_amount:j,capture_lock_id:null,capture_locked_at:null}).eq(
- status for more than 10 minutes. This usually means Stripe succeeded but the database update failed.']}),s.jsx(

### Identity
- identity_already_exists
- identity_not_found
- single_identity_not_deletable
- ${this.url}/user/identities/${t.identity_id}
- ),[a,i]=g.useState(!1),o=kr(),l=Fn(),{user:c,signOut:u}=$t();g.useEffect(()=>{i(!1)},[l.pathname]);const[d,f]=g.useState({username:null,avatar_url:null}),[h,m]=g.useState({identity:!1,payout:!1,loading:!0});g.useEffect(()=>{if(!r.trim())return;const x=setTimeout(()=>{e==null||e(r.trim()),o(`/?search=${encodeURIComponent(r.trim())}`)},300);return()=>clearTimeout(x)},[r]);const ...
- )},[v,w]=g.useState(0);return g.useEffect(()=>{if(!c){w(0),m({identity:!1,payout:!1,loading:!1});return}const x=async()=>{try{const{count:P,error:C}=await $.from(
- ,c.id).single();P&&(f({username:P.username,avatar_url:P.avatar_url}),m(C=>({identity:C.identity||P.identity_verified===!0,payout:C.payout||P.stripe_connect_payouts_enabled===!0,loading:C.loading})))}catch(P){console.error(
- ,{identity:(P=A.error)==null?void 0:P.message,connect:(C=T.error)==null?void 0:C.message}),m(k=>{var E,O,R;return{identity:k.identity||((E=A.data)==null?void 0:E.verified)===!0,payout:k.payout||((O=T.data)==null?void 0:O.payouts_enabled)===!0||((R=T.data)==null?void 0:R.onboarding_complete)===!0,loading:!1}})}catch(A){console.error(

### Connect
- ,O1=1e4,lZ=1e3,cZ=100;var $h;(function(e){e[e.connecting=0]=
- })(I1||(I1={}));var Ql;(function(e){e.Connecting=
- ,enabled:!1},private:!1},r.config),this.timeout=this.socket.timeout,this.joinPush=new gw(this,Na.join,this.params,this.timeout),this.rejoinTimer=new s5(()=>this._rejoinUntilConnected(),this.socket.reconnectAfterMs),this.joinPush.receive(
- ,this.headers={},this.params={},this.timeout=O1,this.transport=null,this.heartbeatIntervalMs=Cg.HEARTBEAT_INTERVAL,this.heartbeatTimer=void 0,this.pendingHeartbeatRef=null,this.heartbeatCallback=GE,this.ref=0,this.reconnectTimer=null,this.logger=GE,this.conn=null,this.sendBuffer=[],this.serializer=new uZ,this.stateChangeCallbacks={open:[],close:[],error:[],message:[]},this.accessToken=null,this._connectionState=
- ,this._wasManualDisconnect=!1,this._authPromise=null,this._resolveFetch=a=>{let i;return a?i=a:typeof fetch>
- );this.apiKey=r.params.apikey,this.endPoint=`${t}/${I1.websocket}`,this.httpEndpoint=i5(t),this._initializeOptions(r),this._setupReconnectionTimer(),this.fetch=this._resolveFetch(r==null?void 0:r.fetch)}connect(){if(!(this.isConnecting()||this.isDisconnecting()||this.conn!==null&&this.isConnected())){if(this._setConnectionState(
- ),this.transport)this.conn=new this.transport(this.endpointURL());else try{this.conn=sZ.createWebSocket(this.endpointURL())}catch(t){this._setConnectionState(
- const client = new RealtimeClient(url, { ...options, transport: ws })`):new Error(`WebSocket not available: ${r}`)}this._setupConnectionHandlers()}}endpointURL(){return this._appendParams(this.endPoint,Object.assign({},this.params,{vsn:oZ}))}disconnect(t,r){if(!this.isDisconnecting())if(this._setConnectionState(

### payout
- ),[a,i]=g.useState(!1),o=kr(),l=Fn(),{user:c,signOut:u}=$t();g.useEffect(()=>{i(!1)},[l.pathname]);const[d,f]=g.useState({username:null,avatar_url:null}),[h,m]=g.useState({identity:!1,payout:!1,loading:!0});g.useEffect(()=>{if(!r.trim())return;const x=setTimeout(()=>{e==null||e(r.trim()),o(`/?search=${encodeURIComponent(r.trim())}`)},300);return()=>clearTimeout(x)},[r]);const ...
- )},[v,w]=g.useState(0);return g.useEffect(()=>{if(!c){w(0),m({identity:!1,payout:!1,loading:!1});return}const x=async()=>{try{const{count:P,error:C}=await $.from(
- ,c.id).single();P&&(f({username:P.username,avatar_url:P.avatar_url}),m(C=>({identity:C.identity||P.identity_verified===!0,payout:C.payout||P.stripe_connect_payouts_enabled===!0,loading:C.loading})))}catch(P){console.error(
- ,{identity:(P=A.error)==null?void 0:P.message,connect:(C=T.error)==null?void 0:C.message}),m(k=>{var E,O,R;return{identity:k.identity||((E=A.data)==null?void 0:E.verified)===!0,payout:k.payout||((O=T.data)==null?void 0:O.payouts_enabled)===!0||((R=T.data)==null?void 0:R.onboarding_complete)===!0,loading:!1}})}catch(A){console.error(
- ,onClick:()=>i(!1),children:[s.jsx(mn,{className:`h-4 w-4 mr-2 flex-shrink-0 ${!h.loading&&h.identity&&h.payout?
- ,{className:!h.loading&&h.identity&&h.payout?
- })]}),!h.loading&&(h.identity&&h.payout?s.jsx(
- ).select(` id, amount, platform_fee_amount, stripe_fee_amount, total_charged_amount, payout_sent_amount, captured_at, created_at, capture_status, bounty_id `).eq(

### Payout
- ),[a,i]=g.useState(!1),o=kr(),l=Fn(),{user:c,signOut:u}=$t();g.useEffect(()=>{i(!1)},[l.pathname]);const[d,f]=g.useState({username:null,avatar_url:null}),[h,m]=g.useState({identity:!1,payout:!1,loading:!0});g.useEffect(()=>{if(!r.trim())return;const x=setTimeout(()=>{e==null||e(r.trim()),o(`/?search=${encodeURIComponent(r.trim())}`)},300);return()=>clearTimeout(x)},[r]);const ...
- )},[v,w]=g.useState(0);return g.useEffect(()=>{if(!c){w(0),m({identity:!1,payout:!1,loading:!1});return}const x=async()=>{try{const{count:P,error:C}=await $.from(
- ,c.id).single();P&&(f({username:P.username,avatar_url:P.avatar_url}),m(C=>({identity:C.identity||P.identity_verified===!0,payout:C.payout||P.stripe_connect_payouts_enabled===!0,loading:C.loading})))}catch(P){console.error(
- ,{identity:(P=A.error)==null?void 0:P.message,connect:(C=T.error)==null?void 0:C.message}),m(k=>{var E,O,R;return{identity:k.identity||((E=A.data)==null?void 0:E.verified)===!0,payout:k.payout||((O=T.data)==null?void 0:O.payouts_enabled)===!0||((R=T.data)==null?void 0:R.onboarding_complete)===!0,loading:!1}})}catch(A){console.error(
- ,onClick:()=>i(!1),children:[s.jsx(mn,{className:`h-4 w-4 mr-2 flex-shrink-0 ${!h.loading&&h.identity&&h.payout?
- ,{className:!h.loading&&h.identity&&h.payout?
- })]}),!h.loading&&(h.identity&&h.payout?s.jsx(
- ).select(` id, amount, platform_fee_amount, stripe_fee_amount, total_charged_amount, payout_sent_amount, captured_at, created_at, capture_status, bounty_id `).eq(

### Complete your profile
- t up your profile so you can start posting or hunting bounties"})]}),s.jsxs(re,{children:[s.jsx(Ce,{children:s.jsxs(Ee,{className:"flex items-center gap-2 text-lg",children:[s.jsx(Nt,{className:"h-5 w-5 text-primary"}),"Complete Your Profile"]})}),s.jsx(se,{children:s.jsxs("form",{onSubmit:w(P),className:"space-y-6",children:[s.jsxs("div",{className:"space-y-2",children:[s.jsx(xe,{htmlFor:"username",children:"Username *"}),s.jsx(Le,{id:"username",placeholde

### profile
- react.profiler
- );return e}};mt.Component=nf;mt.Fragment=Z7;mt.Profiler=eq;mt.PureComponent=YN;mt.StrictMode=J7;mt.Suspense=sq;mt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=dq;mt.act=JM;mt.cloneElement=function(e,t,r){if(e==null)throw Error(
- [Push] Common cause: iOS build was signed without aps-environment (Push capability missing on App ID / provisioning profile).
- );return e}function Ute({children:e}){const[t,r]=g.useState(!1),[n,a]=g.useState(null),i=l=>{a(l),r(!0)},o=()=>{r(!1),a(null)};return s.jsxs(oL.Provider,{value:{openReviewModal:i,closeReviewModal:o},children:[e,n&&s.jsx(Fte,{open:t,onOpenChange:l=>{l||o()},bountyId:n,onComplete:o})]})}function cn({children:e,allowIncompleteProfile:t=!1}){const{user:r,loading:n}=$t(),a=Fn(),[i,o]=g.useState({status:
- ,r.id).maybeSingle();if(l)return;if(f){if(console.warn(`[ProtectedRoute] profile query error (attempt ${u}):`,f.message),u<2){setTimeout(()=>void c(u+1),600);return}o({status:
- ,description:`Updated ${z.updated} profiles with unique avatar photos.`})}catch(z){console.error(
- ,description:`Updated ${z.updated} profiles. ${z.not_found} not found.`})}catch(z){console.error(
- ,description:`Deleted ${v} and cleared user profile. They can now restart onboarding.`}),w(

### messages
- },body:JSON.stringify({messages:[{topic:this.subTopic,event:i,payload:o,private:this.private}]})};try{const u=await this._fetchWithTimeout(this.broadcastEndpointURL,c,(n=r.timeout)!==null&&n!==void 0?n:this.timeout);return await((a=u.body)===null||a===void 0?void 0:a.cancel()),u.ok?
- );const a=Object.assign(Object.assign({},DJ),t);if(this.logDebugMessages=!!a.debug,typeof a.debug==
- messages
- [Push] Failed to count unread messages for badge sync:
- /messages
- :`Messages${v>0?` (${v} unread)`:
- :`${v} unread messages`,children:v})]})}),s.jsx(Iw,{}),s.jsxs(H1,{children:[s.jsx(G1,{asChild:!0,children:s.jsx(D,{variant:
- :`${v} unread messages`,children:v})]})}),s.jsx(Iw,{})]})]}),s.jsx(D,{variant:

### Messages
- },body:JSON.stringify({messages:[{topic:this.subTopic,event:i,payload:o,private:this.private}]})};try{const u=await this._fetchWithTimeout(this.broadcastEndpointURL,c,(n=r.timeout)!==null&&n!==void 0?n:this.timeout);return await((a=u.body)===null||a===void 0?void 0:a.cancel()),u.ok?
- );const a=Object.assign(Object.assign({},DJ),t);if(this.logDebugMessages=!!a.debug,typeof a.debug==
- messages
- [Push] Failed to count unread messages for badge sync:
- /messages
- :`Messages${v>0?` (${v} unread)`:
- :`${v} unread messages`,children:v})]})}),s.jsx(Iw,{}),s.jsxs(H1,{children:[s.jsx(G1,{asChild:!0,children:s.jsx(D,{variant:
- :`${v} unread messages`,children:v})]})}),s.jsx(Iw,{})]})]}),s.jsx(D,{variant:

### support
- forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported
- ){var bg=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!bg.isDisabled&&bg.supportsFiber)try{Rx=bg.inject(wW),di=bg}catch{}}Es.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=bW;Es.createPortal=function(e,t){var r=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!US(t))throw Error(Ne(200));return yW(e,t,null,r)};Es.createRoot=function(e,t){if(!US(e))throw Error(Ne(299));var r=!1,n=
- ||!CSS.supports?!1:CSS.supports(
- relative pathnames are not supported in memory history:
- ,error:`Node.js ${r} detected without native WebSocket support.`,workaround:`For Node.js < 22, install
- ;throw t.workaround&&(r+=` Suggested solution: ${t.workaround}`),new Error(r)}static createWebSocket(t,r){const n=this.getWebSocketConstructor();return new n(t,r)}static isWebSocketSupported(){try{const t=this.detectEnvironment();return t.type===
- )?new Error(`${r} To use Realtime in Node.js, you need to provide a WebSocket implementation: Option 1: Use Node.js 22+ which has native WebSocket support Option 2: Install and provide the
- Web Worker is not supported

### ticket
- new_support_ticket
- ,t).maybeSingle();if(n)throw n;return!!(r!=null&&r.is_support_admin)},async getAllTickets(){const{data:e,error:t}=await $.rpc(
- );if(t)throw t;return e||[]},async getTicketDetails(e){const{data:t,error:r}=await $.rpc(
- ,{ticket_id_param:e});if(r)throw r;return(t==null?void 0:t[0])||null},async getTicketMessages(e){const{data:t,error:r}=await $.from(
- ,{ticket_id_param:e,message_param:t});if(n)throw n;return r},async updateTicketStatus(e,t){const r={status:t};(t===
- ,e);if(n)throw n},async updateTicketPriority(e,t){const{error:r}=await $.from(
- ,e);if(r)throw r},async assignTicket(e,t){const{error:r}=await $.from(
- ,new Date(Date.now()-2592e6).toISOString());if(t)throw t;const r=new Date,n=new Date(r.getFullYear(),r.getMonth(),r.getDate()-r.getDay());return{totalTickets:(e==null?void 0:e.length)||0,openTickets:(e==null?void 0:e.filter(a=>a.status===

### tiers
- /hunter-tiers
- Learn about Hunter Tiers â
- s average review score. The gold star next to their name is their tier â earned only through completed bounties."]}),s.jsx("p",{children:"Tiers update automatically as claims are accepted. There

### Hunter tiers
- Learn about Hunter Tiers â

### only pay
- BountyBay is a reverse marketplace where you post what you're looking for, and verified hunters find it for you. Think of it as a "finder's fee" marketplaceâyou set a reward, hunters compete to find your item, and you only pay when someone delivers.
- Yes, you can cancel anytime before a claim is accepted. If a hunter has an accepted claim in progress, cancellation requires mutual agreement. You only pay if you approve a submission.
- We want posting to be frictionlessâmore bounties means more opportunities for hunters. Hunters only pay when they successfully earn money, so you never pay unless you're getting paid. It aligns incentives for everyone.
- Only pay Stripe processing
- We connect people looking for hard-to-find items with a community of hunters who get paid to find them. Simple, safe, and you only pay when successful.
- t be replaced.",description:"BountyBay is the best way to find a discontinued stuffed animal, lost baby blanket, or childhood comfort item. Post a bounty with a reward, and let our hunters track it down for you.",heroGradient:"bg-gradient-to-br from-pink-400/10 via-background to-purple-400/5",icon:s.jsx(BD,{className:"h-10 w-10 text-pink-500"}),trustBadgeText:"ID-verified hunters. Secure escrow. You only pay when found.",ctaText:"Post a Bounty for a Plushie or Blanket",emptyMessage:"No ...

### BountyBay fee
- xt-xs text-muted-foreground",children:["Accepted ",as(new Date(E.accepted_at),{addSuffix:!0})]})]}),s.jsx(xj,{label:"Bounty",value:E.bounty_amount}),s.jsx(xj,{label:"Hunter paid",value:E.hunter_payout}),s.jsx(xj,{label:"BountyBay fee",value:E.platform_fee,strong:!0})]},E.submission_id))})})]}),s.jsxs("div",{children:[s.jsx("h3",{className:"text-sm font-semibold text-muted-foreground mb-2 px-1",children:"Traffic — last 30 days"}),s.jsxs("div",{classN

### Hunter paid
- medium",children:E.title}),s.jsxs("div",{className:"text-xs text-muted-foreground",children:["Accepted ",as(new Date(E.accepted_at),{addSuffix:!0})]})]}),s.jsx(xj,{label:"Bounty",value:E.bounty_amount}),s.jsx(xj,{label:"Hunter paid",value:E.hunter_payout}),s.jsx(xj,{label:"BountyBay fee",value:E.platform_fee,strong:!0})]},E.submission_id))})})]}),s.jsxs("div",{children:[s.jsx("h3",{className:"text-sm font-semibold text-muted-foreground mb-2 px-1",

### Platform fees
- ð° No platform fees for posters. Hunters pay $2 + 5% when paid out.

### accept
- acceptCharset
- accept-charset
- ?i&&n>r:!i&&a>r};function fH(e=()=>{}){const t=Or(e);Rr(()=>{let r=0,n=0;return r=window.requestAnimationFrame(()=>n=window.requestAnimationFrame(t)),()=>{window.cancelAnimationFrame(r),window.cancelAnimationFrame(n)}},[t])}function hH(e){return e.nodeType===e.ELEMENT_NODE}function mH(e){const t=[],r=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:n=>{const a=n.tagName===
- ;return n.disabled||n.hidden||a?NodeFilter.FILTER_SKIP:n.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;r.nextNode();)t.push(r.currentNode);return t}function cw(e){const t=document.activeElement;return e.some(r=>r===t?!0:(r.focus(),document.activeElement!==t))}var pH=fD,ND=mD,SD=gD,kD=yD,CD=vD,PD=bD,ED=WS;function TD(e){var t,r,n=
- &&!p.altKey&&!p.ctrlKey&&!p.metaKey,w=document.activeElement;if(v&&w){const x=p.currentTarget,[b,_]=bee(x);b&&_?!p.shiftKey&&w===_?(p.preventDefault(),r&&To(b,{select:!0})):p.shiftKey&&w===b&&(p.preventDefault(),r&&To(_,{select:!0})):w===x&&p.preventDefault()}},[r,n,m.paused]);return s.jsx($e.div,{tabIndex:-1,...o,ref:h,onKeyDown:y})});mb.displayName=vee;function xee(e,{select:t=!1}={}){const r=document.activeElement;for(const n of ...
- ;return n.disabled||n.hidden||a?NodeFilter.FILTER_SKIP:n.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;r.nextNode();)t.push(r.currentNode);return t}function mT(e,t){for(const r of e)if(!wee(r,{upTo:t}))return r}function wee(e,{upTo:t}){if(getComputedStyle(e).visibility===
- accepted
- submission_accepted

### Accepted
- accepted
- submission_accepted
- ;function Tie(){const[e,t]=g.useState(!1);g.useEffect(()=>{if(Je.isNativePlatform())return;if(!localStorage.getItem(Dw)){const i=setTimeout(()=>t(!0),1e3);return()=>clearTimeout(i)}},[]);const r=()=>{localStorage.setItem(Dw,JSON.stringify({accepted:!0,timestamp:new Date().toISOString(),analytics:!0,functional:!0})),t(!1)},n=()=>{localStorage.setItem(Dw,JSON.stringify({accepted:!1,timestamp:new Date().toISOString(),analytics:!1,functional:!0})),t(!1)};return e?s.jsx(
- ,e.ACCEPTED=
- );if(t===or.ACCEPTED||t===or.REJECTED)try{await $.functions.invoke(
- submission-accepted-${i.id}
- claim_accepted
- Claim Accepted

### reject
- rejected
- }${a}; path=${i}; ${o};`}catch(r){return Promise.reject(r)}}async deleteCookie(t){try{document.cookie=`${t.key}=; Max-Age=0`}catch(r){return Promise.reject(r)}}async clearCookies(){try{const t=document.cookie.split(
- ).replace(/=.*/,`=;expires=${new Date().toUTCString()};path=/`)}catch(t){return Promise.reject(t)}}async clearAllCookies(){try{await this.clearCookies()}catch(t){return Promise.reject(t)}}}Rp(
- ,gu=async(e,t,r)=>{await e.setItem(t,JSON.stringify(r))},Fl=async(e,t)=>{const r=await e.getItem(t);if(!r)return null;try{return JSON.parse(r)}catch{return r}},So=async(e,t)=>{await e.removeItem(t)};class hb{constructor(){this.promise=new hb.promiseConstructor((t,r)=>{this.resolve=t,this.reject=r})}}hb.promiseConstructor=Promise;function bw(e){const t=e.split(
- submission_rejected
- ),i)};throw o}))}catch(o){return Promise.reject(o)}}},Tt;(function(e){e.assertEqual=a=>{};function t(a){}e.assertIs=t;function r(a){throw new Error}e.assertNever=r,e.arrayToEnum=a=>{const i={};for(const o of a)i[o]=o;return i},e.getValidEnumValues=a=>{const i=e.objectKeys(a).filter(l=>typeof a[a[l]]!=
- ,e.REJECTED=
- ,proofUrls:e.proof_urls||[],proofImages:[],status:e.status,submittedAt:Zh(e.created_at),updatedAt:Zh(e.updated_at||e.created_at),rejectionReason:e.rejection_reason||void 0}),Bt={async getBounties(e=1,t=20,r={}){try{if(r.keyword&&r.keyword.trim().length>0)return this._getBountiesFTS(e,t,r);let n=$.from(

### duplicate
- ))}}return new Hf.default({method:i,url:this.url,headers:this.headers,schema:this.schema,body:t,fetch:(a=this.fetch)!==null&&a!==void 0?a:fetch})}upsert(t,{onConflict:r,ignoreDuplicates:n=!1,count:a,defaultToNull:i=!0}={}){var o;const l=
- }-duplicates`),r!==void 0&&this.url.searchParams.set(
- ,`leaving duplicate topic
- ,reversed:!1,allowDuplicatedCategory:!0});function Qd(e){
- ,{allowDuplicatedCategory:!0,allowDecimals:!0,hide:!1,orientation:
- &&V){var U=V,z=k.every(function(H){return U.indexOf(H)>=0});z&&(k=U)}}return ue(ue({},y),{},Ze({},C,ue(ue({},w),{},{axisType:i,domain:k,categoricalDomain:O,duplicateDomain:E,originalDomain:(v=w.domain)!==null&&v!==void 0?v:R,isCategorical:m,layout:d})))},{})},oOe=function(t,r){var ...
- ?E.dataKey(Z.payload):null}if(de)if(O>=0){var te,K;if(E.dataKey&&!E.allowDuplicatedCategory){var Ae=typeof E.dataKey==

### dispute
- dispute_opened
- dispute_resolved
- ).length)||0,bounty_dispute:(e==null?void 0:e.filter(a=>a.type===
- ).length)||0,submission_dispute:(e==null?void 0:e.filter(a=>a.type===
- ).length)||0}}}},joe={platform_issue:Xt,bounty_dispute:Ir,submission_dispute:Ir,payment_issue:Ft,account_issue:wr,bug_report:gm,feature_request:xr,other:Yi},yA={open:
- ,bounty_dispute:
- ,submission_dispute:
- ]})]})})})]})}const zOe={platform_issue:Xt,bounty_dispute:Ir,submission_dispute:Ir,payment_issue:Ft,account_issue:wr,bug_report:gm,feature_request:xr,other:Yi},qOe={open:

### refund
- ,e.REFUNDED=
- +fh()};return gj.push(r),r},async releaseEscrow(e){await Zn(1e3);const t=gj.find(r=>r.id===e);return t&&t.status===rn.DEPOSITED?(t.status=rn.RELEASED,t.releasedAt=new Date,!0):!1},async refundEscrow(e){await Zn(1e3);const t=gj.find(r=>r.id===e);return t&&t.status===rn.DEPOSITED?(t.status=rn.REFUNDED,t.refundedAt=new Date,!0):!1}};function r4e(){const[e,t]=g.useState({status:rn.PENDING}),[r,n]=g.useState(!1),{toast:a}=Ke(),i={id:
- })}finally{n(!1)}},c=async()=>{if(e.transactionId)try{n(!0),await yj.refundEscrow(e.transactionId)&&(t(f=>({...f,status:rn.REFUNDED})),a({title:
- });case rn.REFUNDED:return s.jsx(le,{variant:
- ]})]}),e.status===rn.REFUNDED&&s.jsxs(Rt,{children:[s.jsx(rr,{className:
- and funds are released to the Hunter, the transaction is complete and irreversible. No refunds will be issued after payout has been processed. Posters are responsible for thoroughly reviewing all proof and evidence before accepting a submission. BountyBay strongly recommends using the 7-day hold period to verify delivery before early release of funds.`]})]}),s.jsxs(
- If your bounty expires without an accepted claim, you can request a full refund of your escrowed funds (minus Stripe processing fees, which are non-refundable). Consider increasing the reward or adjusting requirements to attract more hunters.
- We review evidence from both partiesâsubmitted proof, messages, tracking info, etc. We aim for fair resolution: refunds, partial payments, or determining which party fulfilled their obligations. Most disputes resolve within 14 days.

### checkout
- CheckoutContext
- in both <CheckoutProvider> and <Elements> providers.
- in k?k.checkoutState:null,R=(O==null?void 0:O.type)===
- ?O.checkout:null,B=I.useState(null),V=Q9(B,2),L=V[0],M=V[1],U=I.useRef(null),z=I.useRef(null);zn(L,
- :Q=R.createExpressCheckoutElement(h);break;case

### reward
- ll reimburse their purchase cost + pay the bounty reward."})]})]})]})]})]}),s.jsxs(re,{className:"bg-card border-border",children:[s.jsx(Ce,{className:"pb-4 sm:pb-6",children:s.jsxs(Ee,{className:"flex items-center gap-2 text-lg sm:text-xl",children:[s.jsx(Ft,{className:"h-4 w-4 sm:h-5 sm:w-5"}),"Pricing"]})}),s.jsxs(se,{className:"space-y-5 sm:space-y-6",children:[s.jsxs(Rt,{className:"bg-background border-border",children:[s.jsx(Ir,{className:"h-4 w-4 ...
- Bounty Reward (Finder's Fee)
- ð° This is your reward to the hunter for
- Bounty Reward:
- :!0})]})]})}function $Me({bounty:e}){var i,o,l;const t=`Help me find: $${e.bountyAmount} Bounty â ${e.title} | BountyBay`,r=`$${e.bountyAmount} reward to find this item! ${e.description.slice(0,120)}${e.description.length>120?
- ,totalReferred:p||0,pendingRewards:v||0,earnedCredits:Number(m==null?void 0:m.referral_credits)||0,completedBounties:w||0,isPartner:(m==null?void 0:m.is_partner)||!1,partnerName:(m==null?void 0:m.partner_name)||null,partnerCommissionPercent:m!=null&&m.partner_commission_percent?Number(m.partner_commission_percent):null,partnerFlatFeeCents:(m==null?void 0:m.partner_flat_fee_cents)||null})}catch(m){console.error(
- ,children:r.pendingRewards}),s.jsx(
- BountyBay is a reverse marketplace where you post what you're looking for, and verified hunters find it for you. Think of it as a "finder's fee" marketplaceâyou set a reward, hunters compete to find your item, and you only pay when someone delivers.

### source
- externalResourcesRequired
- ),n?e.setProperty(r,a):e[r]=a}}var Pq=jr({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function Tj(e,t){if(t){if(Pq[e]&&(t.children!=null||t.dangerouslySetInnerHTML!=null))throw Error(Ne(137,e));if(t.dangerouslySetInnerHTML!=null){if(t.children!=null)throw Error(Ne(60));if(typeof t.dangerouslySetInnerHTML!=
- ,n=t;do r+=Nq(n),n=n.return;while(n);var a=r}catch(i){a=` Error generating stack: `+i.message+` `+i.stack}return{value:e,source:t,stack:a,digest:null}}function nw(e,t,r){return{value:e,source:null,stack:r??null,digest:t??null}}function Zj(e,t){try{console.error(t.value)}catch(r){setTimeout(function(){throw r})}}var QV=typeof WeakMap==
- source
- ),Error(Ne(268,e)));return e=j4(t),e=e===null?null:e.stateNode,e};Es.flushSync=function(e){return kc(e)};Es.hydrate=function(e,t,r){if(!Gx(t))throw Error(Ne(200));return Yx(null,e,t,!0,r)};Es.hydrateRoot=function(e,t,r){if(!US(e))throw Error(Ne(405));var n=r!=null&&r.hydratedSources||null,a=!1,i=
- ).trim();/** * @license lucide-react v0.462.0 - ISC * * This source code is licensed under the ISC license. * See the LICENSE file in the root directory of this source tree. */var yH={xmlns:
- };/** * @license lucide-react v0.462.0 - ISC * * This source code is licensed under the ISC license. * See the LICENSE file in the root directory of this source tree. */const vH=g.forwardRef(({color:e=
- ,a),...l},[...o.map(([u,d])=>g.createElement(u,d)),...Array.isArray(i)?i:[i]]));/** * @license lucide-react v0.462.0 - ISC * * This source code is licensed under the ISC license. * See the LICENSE file in the root directory of this source tree. */const ve=(e,t)=>{const r=g.forwardRef(({className:n,...a},i)=>g.createElement(vH,{ref:i,iconNode:t,className:AD(`lucide-${gH(e)}`,n),...a}));return r.displayName=`${e}`,r};/** * @license lucide-react v0.462.0 - ISC * * This source code is licensed ...

### Source
- externalResourcesRequired
- ),n?e.setProperty(r,a):e[r]=a}}var Pq=jr({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function Tj(e,t){if(t){if(Pq[e]&&(t.children!=null||t.dangerouslySetInnerHTML!=null))throw Error(Ne(137,e));if(t.dangerouslySetInnerHTML!=null){if(t.children!=null)throw Error(Ne(60));if(typeof t.dangerouslySetInnerHTML!=
- ,n=t;do r+=Nq(n),n=n.return;while(n);var a=r}catch(i){a=` Error generating stack: `+i.message+` `+i.stack}return{value:e,source:t,stack:a,digest:null}}function nw(e,t,r){return{value:e,source:null,stack:r??null,digest:t??null}}function Zj(e,t){try{console.error(t.value)}catch(r){setTimeout(function(){throw r})}}var QV=typeof WeakMap==
- source
- ),Error(Ne(268,e)));return e=j4(t),e=e===null?null:e.stateNode,e};Es.flushSync=function(e){return kc(e)};Es.hydrate=function(e,t,r){if(!Gx(t))throw Error(Ne(200));return Yx(null,e,t,!0,r)};Es.hydrateRoot=function(e,t,r){if(!US(e))throw Error(Ne(405));var n=r!=null&&r.hydratedSources||null,a=!1,i=
- ).trim();/** * @license lucide-react v0.462.0 - ISC * * This source code is licensed under the ISC license. * See the LICENSE file in the root directory of this source tree. */var yH={xmlns:
- };/** * @license lucide-react v0.462.0 - ISC * * This source code is licensed under the ISC license. * See the LICENSE file in the root directory of this source tree. */const vH=g.forwardRef(({color:e=
- ,a),...l},[...o.map(([u,d])=>g.createElement(u,d)),...Array.isArray(i)?i:[i]]));/** * @license lucide-react v0.462.0 - ISC * * This source code is licensed under the ISC license. * See the LICENSE file in the root directory of this source tree. */const ve=(e,t)=>{const r=g.forwardRef(({className:n,...a},i)=>g.createElement(vH,{ref:i,iconNode:t,className:AD(`lucide-${gH(e)}`,n),...a}));return r.displayName=`${e}`,r};/** * @license lucide-react v0.462.0 - ISC * * This source code is licensed ...
