// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

import "@openzeppelin/contracts/utils/Strings.sol";

// PUSH Comm Contract Interface
interface IPUSHCommInterface {
    function sendNotification(address _channel, address _recipient, bytes calldata _identity) external;
}

contract Notifications {
    // EPNS COMM ADDRESS ON ETHEREUM KOVAN, CHECK THIS: https://docs.epns.io/developers/developer-tooling/epns-smart-contracts/epns-contract-addresses
    address public EPNS_COMM_ADDRESS = 0xb3971BCef2D791bc4027BbfedFb47319A4AAaaAa;
    address public CHANNEL_ADDRESS = 0xA353884673B0971e47e5520a5502E379b237600D;

    function notificationToSeller(address to, uint amount, bytes32 destinationFiatSymbol) internal returns (bool success)  {
        IPUSHCommInterface(EPNS_COMM_ADDRESS).sendNotification(
            CHANNEL_ADDRESS, // from channel
            to, // to recipient, put address(this) in case you want Broadcast or Subset. For Targetted put the address to which you want to send
            bytes(
                string(
                    // We are passing identity here: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/identity/payload-identity-implementations
                    abi.encodePacked(
                        "0", // this is notification identity: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/identity/payload-identity-implementations
                        "+", // segregator
                        "3", // this is payload type: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/payload (1, 3 or 4) = (Broadcast, targetted or subset)
                        "+", // segregator
                        "Payment Confirmation", // this is notificaiton title
                        "+", // segregator
                        Strings.toString(amount/(10 ** 18)), // notification body
                        "  ", // notification body
                        string(abi.encodePacked(destinationFiatSymbol)), // notification body
                        "  ", // notification body
                        "credited to your wallet: ", // notification body
                        Strings.toHexString(uint256(uint160(to)), 20) // notification body
                    )
                )
            )
        );
        return true;
    }

    function notificationToBuyer(address to, uint amount, bytes32 fiatSymbol) public returns (bool success)  {
        IPUSHCommInterface(EPNS_COMM_ADDRESS).sendNotification(
            CHANNEL_ADDRESS, // from channel
            to, // to recipient, put address(this) in case you want Broadcast or Subset. For Targetted put the address to which you want to send
            bytes(
                string(
                    // We are passing identity here: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/identity/payload-identity-implementations
                    abi.encodePacked(
                        "0", // this is notification identity: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/identity/payload-identity-implementations
                        "+", // segregator
                        "3", // this is payload type: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/payload (1, 3 or 4) = (Broadcast, targetted or subset)
                        "+", // segregator
                        "Payment Confirmation", // this is notificaiton title
                        "+", // segregator
                        Strings.toString(amount/(10 ** 18)), // notification body
                        "  ", // notification body
                        string(abi.encodePacked(fiatSymbol)), // notification body
                        " has been received" // notification body
                         // notification body
                    )
                )
            )
        );
        return true;
    }

    function notificationFromSeller(address to, string memory title, string memory message ) public returns (bool success)  {
        IPUSHCommInterface(EPNS_COMM_ADDRESS).sendNotification(
            CHANNEL_ADDRESS, // from channel
            to, // to recipient, put address(this) in case you want Broadcast or Subset. For Targetted put the address to which you want to send
            bytes(
                string(
                    // We are passing identity here: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/identity/payload-identity-implementations
                    abi.encodePacked(
                        "0", // this is notification identity: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/identity/payload-identity-implementations
                        "+", // segregator
                        "3", // this is payload type: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/payload (1, 3 or 4) = (Broadcast, targetted or subset)
                        "+", // segregator
                         title, // this is notificaiton title
                        "+", // segregator
                        message
                         // notification body
                    )
                )
            )
        );
        return true;
    }
}

  