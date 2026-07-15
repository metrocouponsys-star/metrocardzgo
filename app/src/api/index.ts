// ============================================================
// Metro Cardz — API Router (Production Feature-Flag Switch)
//
// Import ALL API functions from THIS file throughout the app.
//
//   import { login, searchMembers, redeemOffer } from '@/api';
//
// NEXT_PUBLIC_USE_MOCK_DATA=true  → mock data (local dev, default)
// NEXT_PUBLIC_USE_MOCK_DATA=false → real FastAPI backend (production)
//
// Switching environments: change one env var, redeploy. Done.
// ============================================================

import * as mock from './client';
import * as real from './realClient';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';
const api = USE_MOCK ? mock : real;

export const login = api.login;
export const verifyOtp = api.verifyOtp;
export const getDashboardStats = api.getDashboardStats;
export const searchMembers = api.searchMembers;
export const getMemberByToken = api.getMemberByToken;
export const getMember = api.getMember;
export const createMember = api.createMember;
export const updateMember = api.updateMember;
export const redeemOffer = api.redeemOffer;
export const redeemPoints = api.redeemPoints;
export const getMemberRedemptions = api.getMemberRedemptions;
export const getLoyaltyHistory = api.getLoyaltyHistory;
export const getOfferTemplates = api.getOfferTemplates;
export const createOfferTemplate = api.createOfferTemplate;
export const updateOfferTemplate = api.updateOfferTemplate;
export const getMembershipTypes = api.getMembershipTypes;
export const createMembershipType = api.createMembershipType;
export const getCampaigns = api.getCampaigns;
export const createCampaign = api.createCampaign;
export const getReminderRules = api.getReminderRules;
export const updateReminderRule = api.updateReminderRule;
export const getReportData = api.getReportData;
export const getAdminStats = api.getAdminStats;
export const getAllMerchants = api.getAllMerchants;
export const updateMerchantStatus = api.updateMerchantStatus;
export const getMerchantUsers = api.getMerchantUsers;
export const createMerchantUser = api.createMerchantUser;
export const updateMerchant = api.updateMerchant;
export const createMerchant = api.createMerchant;
export const getPublicMemberView = api.getPublicMemberView;
export const getCardInventory = api.getCardInventory;
export const addCardsToInventory = api.addCardsToInventory;
export const allocateCardsToMerchant = api.allocateCardsToMerchant;
export const revokeCardsFromMerchant = api.revokeCardsFromMerchant;
export const deactivateCard = api.deactivateCard;
export const getMerchantCards = api.getMerchantCards;
export const linkCardToMember = api.linkCardToMember;
export const unlinkCard = api.unlinkCard;
export const searchMemberByCard = api.searchMemberByCard;
export const applyReferral = api.applyReferral;
export const renewMember = api.renewMember;
export const getNewMembersReport = api.getNewMembersReport;
export const getTopCustomersReport = api.getTopCustomersReport;
export const getPointsReport = api.getPointsReport;
export const approveMerchant = api.approveMerchant;
export const rejectMerchant = api.rejectMerchant;
export const getAdminMerchants = api.getAdminMerchants;
export const sendCampaign = api.sendCampaign;
export const getReferralLink = api.getReferralLink;
export const downloadCardPdf = api.downloadCardPdf;
export const getRetentionReport = api.getRetentionReport;
export const getRewards = api.getRewards;
export const createReward = api.createReward;
export const updateReward = api.updateReward;
export const deleteReward = api.deleteReward;
export const claimReward = api.claimReward;
export const getRewardClaims = api.getRewardClaims;
export const getCoupons = api.getCoupons;
export const createCoupon = api.createCoupon;
export const updateCoupon = api.updateCoupon;
export const deleteCoupon = api.deleteCoupon;
export const validateCoupon = api.validateCoupon;
export const getVouchers = api.getVouchers;
export const generateVouchers = api.generateVouchers;
export const redeemVoucher = api.redeemVoucher;
export const getPointsRules = api.getPointsRules;
export const createPointsRule = api.createPointsRule;
export const updatePointsRule = api.updatePointsRule;
export const deletePointsRule = api.deletePointsRule;
export const getScratchCards = api.getScratchCards;
export const issueScratchCard = api.issueScratchCard;
export const revealScratchCard = api.revealScratchCard;
export const getLuckyDraws = api.getLuckyDraws;
export const createLuckyDraw = api.createLuckyDraw;
export const updateLuckyDraw = api.updateLuckyDraw;
export const enterLuckyDraw = api.enterLuckyDraw;
export const runLuckyDraw = api.runLuckyDraw;
export const deleteLuckyDraw = api.deleteLuckyDraw;
export const getAdminAllMembers = api.getAdminAllMembers;
export const getAdminReportStats = api.getAdminReportStats;
export const getAdminReportsByMerchant = api.getAdminReportsByMerchant;
export const getAdminMerchantDetail = api.getAdminMerchantDetail;
export const updateStaffRole = api.updateStaffRole;
export const deleteStaff = api.deleteStaff;
export const submitFeedback = api.submitFeedback;
export const getMerchantFeedback = api.getMerchantFeedback;

// ── Google Wallet ────────────────────────────────────────────────────────────
export const generateWalletPassUrl = api.generateWalletPassUrl;
export const getWalletPassStatus = api.getWalletPassStatus;
export const getMerchantWalletClass = api.getMerchantWalletClass;
export const syncAllWalletPasses = api.syncAllWalletPasses;
