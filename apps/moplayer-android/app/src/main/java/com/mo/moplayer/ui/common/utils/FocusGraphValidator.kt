package com.mo.moplayer.ui.common.utils

/**
 * Validates directional focus maps to catch dead-ends and self-loops in tests.
 */
object FocusGraphValidator {

    data class Node(
        val id: String,
        val up: String? = null,
        val down: String? = null,
        val left: String? = null,
        val right: String? = null
    )

    data class ValidationResult(
        val unknownTargets: List<String>,
        val selfLoops: List<String>,
        val deadEnds: List<String>
    ) {
        val isValid: Boolean = unknownTargets.isEmpty() && selfLoops.isEmpty() && deadEnds.isEmpty()
    }

    fun validate(nodes: List<Node>): ValidationResult {
        val ids = nodes.map { it.id }.toSet()

        val unknownTargets = mutableListOf<String>()
        val selfLoops = mutableListOf<String>()
        val deadEnds = mutableListOf<String>()

        nodes.forEach { node ->
            val links =
                mapOf(
                    "up" to node.up,
                    "down" to node.down,
                    "left" to node.left,
                    "right" to node.right
                )

            val hasDirection = links.values.any { !it.isNullOrBlank() }
            if (!hasDirection) deadEnds += node.id

            links.forEach { (dir, target) ->
                if (target.isNullOrBlank()) return@forEach
                if (target == node.id) selfLoops += "${node.id}:$dir"
                if (!ids.contains(target)) unknownTargets += "${node.id}:$dir->$target"
            }
        }

        return ValidationResult(
            unknownTargets = unknownTargets,
            selfLoops = selfLoops,
            deadEnds = deadEnds
        )
    }
}
