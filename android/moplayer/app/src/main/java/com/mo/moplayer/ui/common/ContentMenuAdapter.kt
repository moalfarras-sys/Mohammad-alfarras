package com.mo.moplayer.ui.common

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.annotation.DrawableRes
import androidx.recyclerview.widget.RecyclerView
import com.mo.moplayer.databinding.ItemContextMenuBinding

data class ContentMenuItem(
    val id: String,
    val title: String,
    @DrawableRes val icon: Int,
    val action: () -> Unit
)

class ContentMenuAdapter(
    private val items: List<ContentMenuItem>,
    private val onItemClick: (ContentMenuItem) -> Unit
) : RecyclerView.Adapter<ContentMenuAdapter.MenuItemViewHolder>() {

    private var selectedPosition = 0

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MenuItemViewHolder {
        val binding = ItemContextMenuBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return MenuItemViewHolder(binding)
    }

    override fun onBindViewHolder(holder: MenuItemViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class MenuItemViewHolder(
        private val binding: ItemContextMenuBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        init {
            binding.root.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onItemClick(items[position])
                }
            }

            binding.root.setOnFocusChangeListener { view, hasFocus ->
                if (hasFocus) {
                    selectedPosition = adapterPosition
                    // Animate focus
                    view.animate()
                        .scaleX(1.05f)
                        .scaleY(1.05f)
                        .setDuration(150)
                        .start()
                } else {
                    view.animate()
                        .scaleX(1f)
                        .scaleY(1f)
                        .setDuration(150)
                        .start()
                }
            }
        }

        fun bind(item: ContentMenuItem) {
            binding.tvMenuTitle.text = item.title
            binding.ivMenuIcon.setImageResource(item.icon)
            
            // Request focus for first item
            if (adapterPosition == 0) {
                binding.root.post {
                    binding.root.requestFocus()
                }
            }
        }
    }
}
