// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';

contract PriceFeeder {

    AggregatorV3Interface internal INR2USDpriceFeed;
    AggregatorV3Interface internal EURO2USDpriceFeed;

    constructor(address INR2USDfeedAddress, address EURO2USDfeedAddress){

        INR2USDpriceFeed = AggregatorV3Interface(INR2USDfeedAddress); //
        EURO2USDpriceFeed = AggregatorV3Interface(EURO2USDfeedAddress); //
    }

    function getINR2USDLatestPrice() public view returns (int, uint) {
        (
            /*uint80 roundID*/,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = INR2USDpriceFeed.latestRoundData();
        uint8 decimals = INR2USDpriceFeed.decimals();
        return (price,decimals);
    }

    function getEURO2USDLatestPrice() public view returns (int, uint) {
        (
            /*uint80 roundID*/,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = EURO2USDpriceFeed.latestRoundData();
        uint8 decimals = EURO2USDpriceFeed.decimals();
        return (price,decimals);
    }

    function getEURO2INRLatestPrice() public view returns (int, uint) {
        (
            /*uint80 roundID*/,
            int INR2USDprice,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = INR2USDpriceFeed.latestRoundData();
        uint8 INR2USDdecimals = INR2USDpriceFeed.decimals();

        (
            /*uint80 roundID*/,
            int EURO2USDprice,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = EURO2USDpriceFeed.latestRoundData();
        // uint8 EURO2USDdecimals = EURO2USDpriceFeed.decimals();

        int EURO2INRprice = (EURO2USDprice * (10**8))/INR2USDprice;

        return (EURO2INRprice,INR2USDdecimals);
    }

}