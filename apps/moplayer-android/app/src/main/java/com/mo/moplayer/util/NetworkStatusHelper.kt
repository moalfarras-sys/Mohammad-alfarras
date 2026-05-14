package com.mo.moplayer.util

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.VpnService
import android.os.Build

/**
 * Network status helper: detects connection type, speed, and VPN state.
 *
 * Usage:
 * - Call [refresh()] before showing status.
 * - [isVpnActive] true if a VPN tunnel is active.
 * - [connectionLabel] returns "Wi-Fi", "Ethernet", "5G", "4G", "Mobile", or "Unknown".
 * - [isFastConnection] true for Wi-Fi / Ethernet / 5G.
 */
class NetworkStatusHelper(context: Context) {

    private val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    var isConnected = false
        private set
    var isVpnActive = false
        private set
    var connectionLabel = "Unknown"
        private set
    var isFastConnection = false
        private set
    var isMetered = true
        private set

    fun refresh() {
        val network = cm.activeNetwork
        val caps = network?.let { cm.getNetworkCapabilities(it) }

        isConnected = caps != null &&
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)

        isVpnActive = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            caps?.hasTransport(NetworkCapabilities.TRANSPORT_VPN) == true
        } else {
            // Fallback: check if VPNService is prepared (heuristic)
            VpnService.prepare(cm.javaClass.classLoader.let { null }) != null
        }

        connectionLabel = when {
            caps?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true -> "Ethernet"
            caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> "Wi-Fi"
            caps?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> {
                when {
                    caps.linkDownstreamBandwidthKbps > 50_000 -> "5G"
                    caps.linkDownstreamBandwidthKbps > 10_000 -> "4G"
                    else -> "Mobile"
                }
            }
            else -> if (isConnected) "Unknown" else "Offline"
        }.toString()

        isFastConnection = connectionLabel in setOf("Ethernet", "Wi-Fi", "5G")
        isMetered = !(caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED) == true)
    }
}
